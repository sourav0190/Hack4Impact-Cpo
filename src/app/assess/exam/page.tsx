"use client";
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SKILL_CATEGORIES, Question } from '@/lib/questions';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, Camera, Maximize2, AlertTriangle, CheckCircle2, XCircle, Send, Timer, HelpCircle, ShieldCheck, GraduationCap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// External AI Proctoring URL
const PROCTOR_API_URL = "https://aiprotctor-production.up.railway.app/api/v1/analyze";

function ExamContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const skillId = searchParams.get('skill');
    const difficulty = searchParams.get('difficulty') || 'beginner';

    // State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [isStarted, setIsStarted] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(true);
    const [countdown, setCountdown] = useState(3);
    const [timeElapsed, setTimeElapsed] = useState(0);
    
    // Proctoring State
    const [warnings, setWarnings] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [faceCount, setFaceCount] = useState(0);
    const [suspicionScore, setSuspicionScore] = useState(0);
    const [isTalking, setIsTalking] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const warningCooldown = useRef(0);

    // Warning System
    const calculateScore = useCallback(() => {
        let correctCount = 0;
        questions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });
        return Math.round((correctCount / questions.length) * 100);
    }, [questions, userAnswers]);

    const forceSubmit = useCallback(() => {
        const finalScore = calculateScore();
        toast.error("Proctoring Protocol Violated. Session terminated.");
        router.push(`/assess/result?status=terminated&skill=${skillId}&score=${finalScore}&difficulty=${difficulty}`);
    }, [calculateScore, router, skillId, difficulty]);

    const issueWarning = useCallback((msg: string) => {
        const now = Date.now();
        if (now - warningCooldown.current < 5000) return; // 5s cooldown
        
        warningCooldown.current = now;
        setWarnings(prev => {
            const next = prev + 1;
            if (next >= 4) {
                forceSubmit();
                return next;
            }
            toast.error(`WARNING ${next}/3: ${msg}`, { duration: 6000, icon: '⚠️' });
            return next;
        });
    }, [forceSubmit]);

    // Initial Setup
    useEffect(() => {
        const skill = SKILL_CATEGORIES.find(s => s.id === skillId);
        if (skill) {
            Promise.resolve().then(() => {
                setQuestions(skill.questions[difficulty as keyof typeof skill.questions] || []);
            });
        } else {
            toast.error("Invalid assessment parameters");
            router.push('/assess');
        }

        // Anti-Tab Switch
        const handleVisibilityChange = () => {
            if (document.hidden && isStarted) {
                issueWarning("Tab Switching Detected!");
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Anti-Fullscreen Escape
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [skillId, difficulty, isStarted, issueWarning, router, setQuestions]);


    // Handle video attachment when it mounts
    const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
        console.log("[CAMERA] videoRefCallback called with node:", node ? "HTMLVideoElement" : "null");
        if (node !== null) {
            (videoRef as any).current = node;
            
            if (streamRef.current) {
                setIsCameraActive(true);
                if (!node.srcObject) {
                    console.log("[CAMERA] Attaching existing stream to video node");
                    node.srcObject = streamRef.current;
                    node.play().catch(e => console.error("[CAMERA] Play error:", e));
                } else {
                    console.log("[CAMERA] Video node already has a srcObject");
                }
            } else {
                console.warn("[CAMERA] No stream available in streamRef to attach");
            }
        }
    }, []);



    // Base64 Frame Capture Utility
    const captureFrame = useCallback(() => {
        if (!videoRef.current || videoRef.current.readyState !== 4) return null;
        
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
        
        const canvas = canvasRef.current;
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 (jpeg for smaller payload) - Use 0.8 quality like in user's example
        return canvas.toDataURL('image/jpeg', 0.8);
    }, []);

    const analyzeFrame = useCallback(async () => {
        // Use refs as source of truth for hardware state
        const hasStream = streamRef.current && streamRef.current.active;
        const hasVideo = videoRef.current && videoRef.current.readyState === 4;

        if (!hasStream || !hasVideo) {
            console.log("[DEBUG] Skipping loop tick. Stream active:", !!hasStream, "Video ready:", !!hasVideo);
            // Re-sync UI state if it dropped
            if (hasStream && !isCameraActive) setIsCameraActive(true);
            return;
        }
        
        const frameData = captureFrame();
        if (!frameData) {
            console.log("[DEBUG] Skipping loop tick: Capture failed");
            return;
        }

        try {
            const response = await fetch(PROCTOR_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: frameData }) // Send full data URI
            });

            if (!response.ok) throw new Error(`Proctoring API Error: ${response.status}`);

            const result = await response.json();
            console.log("[CLOUD AI] Analysis Result:", result);
            
            // Map the result based on actual API response structure provided by user
            const detectedPersons = result.person_count ?? 0;
            const currentSuspicion = result.suspicion_score ?? 0;
            
            setFaceCount(detectedPersons);
            setSuspicionScore(currentSuspicion);
            setIsTalking(result.is_talking || false);

            if (detectedPersons > 1 || result.multiple_people === true) {
                issueWarning("Multiple People Detected!");
            } else if (result.face_present === false) {
                issueWarning("No Face Detected!");
            }

            if (result.phone_detected === true) {
                issueWarning("Electronic Device Detected!");
            }

            if (result.book_detected === true) {
                issueWarning("Prohibited Material Detected!");
            }

            if (result.looking_away === true) {
                issueWarning("Eyes off screen detected!");
            }

            if (result.malpractices && result.malpractices.length > 0) {
                // Priority to specific malpractices from the list
                issueWarning(result.malpractices[0]);
            }

            if (currentSuspicion > 80) {
                issueWarning("High Security Risk: Termination Imminent");
            }

        } catch (err) {
            console.error("[CLOUD AI] Analysis Failure:", err);
        }
    }, [captureFrame, issueWarning]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            console.log("[CAMERA] Stopping all tracks...");
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    }, []);

    const startCamera = async () => {
        setCameraError(null);
        try {
            stopCamera();
            console.log("[CAMERA] Requesting user media...");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            console.log("[CAMERA] Stream obtained:", stream.id);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err: any) {
            console.error("[CAMERA] getUserMedia Error:", err);
            const errorMsg = err.name === 'NotReadableError' 
                ? "Camera is already in use. Please close other tabs/apps." 
                : "Camera access denied.";
            setCameraError(errorMsg);
            toast.error(errorMsg);
        }
    };

    // Corrected Analysis Loop: MUST NOT stop camera on interval cleanup
    useEffect(() => {
        if (isStarted) {
            console.log("[CLOUD AI] Loop Started (1500ms)");
            analysisIntervalRef.current = setInterval(() => {
                analyzeFrame();
            }, 1500);
        }
        
        return () => {
            if (analysisIntervalRef.current) {
                console.log("[CLOUD AI] Loop Cleared (Interval Only)");
                clearInterval(analysisIntervalRef.current);
                analysisIntervalRef.current = null;
            }
        };
    }, [isStarted, analyzeFrame]);

    // Dedicated Camera Lifecycle Cleanup
    useEffect(() => {
        return () => {
            console.log("[LIFECYCLE] Component unmounting, cleaning up camera...");
            if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
            // This is the ONLY place where we kill the hardware tracks on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startExam = async () => {
        try {
            console.log("[START] Requesting fullscreen...");
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
            
            console.log("[START] Initializing camera...");
            await startCamera();
            
            // Countdown
            console.log("[START] Starting countdown...");
            let count = 3;
            const timer = setInterval(() => {
                count -= 1;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(timer);
                    console.log("[START] Countdown finished. Exam started.");
                    setIsCountingDown(false);
                    setIsStarted(true);
                }
            }, 1000);
        } catch (err) {
            console.error("[START] Failed to start exam:", err);
            toast.error("Full-screen mode and camera access required to start");
        }
    };

    const handleOptionSelect = (qId: number, optionIdx: number) => {
        setUserAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    };

    // Timer Implementation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStarted) {
            interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isStarted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = () => {
        const score = calculateScore();
        toast.success("Exam Submitted Successfully!");
        router.push(`/assess/result?status=success&skill=${skillId}&score=${score}&time=${timeElapsed}&difficulty=${difficulty}`);
    };

    if (!isStarted && isCountingDown && countdown > 0 && isFullscreen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background pointer-events-none">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={countdown}
                    className="text-[12rem] font-black gold-text-gradient italic"
                >
                    {countdown}
                </motion.div>
                <p className="text-gray-400 font-bold uppercase tracking-[0.5em] animate-pulse">Initializing Neural Link...</p>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background relative">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass p-12 rounded-[4rem] text-center max-w-2xl border-white/5 shadow-2xl"
                >
                    <div className="w-24 h-24 bg-gold/10 rounded-[2.5rem] flex items-center justify-center text-gold mb-10 mx-auto ring-1 ring-gold/20 shadow-gold-glow">
                        <ShieldAlert size={48} />
                    </div>
                    <h1 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">
                        Security <span className="gold-text-gradient">Checkpoint</span>
                    </h1>
                    <p className="text-gray-400 text-lg mb-12 font-medium leading-relaxed">
                        To maintain on-chain integrity, this session will use real-time AI computer vision. Please ensure you are in a quiet, well-lit environment.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-12 text-left">
                        {[
                            { label: "AI Engine", val: isModelLoading ? "Loading..." : "Ready", ok: !isModelLoading },
                            { label: "Environment", val: "Controlled", ok: true },
                            { label: "Privacy", val: "Local Only", ok: true },
                            { label: "Full-screen", val: "Required", ok: true }
                        ].map((stat, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{stat.label}</span>
                                <span className={`text-sm font-bold ${stat.ok ? 'text-gold' : 'text-red-500'}`}>{stat.val}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={startExam}
                        disabled={isModelLoading}
                        className="w-full bg-gold hover:bg-gold-dark disabled:opacity-30 text-black font-black py-6 rounded-2xl text-xl flex items-center justify-center gap-4 transition-all shadow-gold-glow uppercase tracking-widest"
                    >
                        {isModelLoading ? <Loader2 className="animate-spin" /> : <Maximize2 size={24} />}
                        Enter Secure Mode
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#080808] text-white flex overflow-hidden">
            {/* Left: Exam Content */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-20 relative">
                {/* Anti-Cheat Overlay for Exit Fullscreen */}
                <AnimatePresence>
                    {!isFullscreen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center"
                        >
                            <AlertTriangle size={80} className="text-red-500 mb-8 animate-bounce" />
                            <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">Warning: Security Breach</h2>
                            <p className="text-gray-400 max-w-md mb-12 font-medium">Full-screen mode was exited. Continued attempts will result in automatic disqualification.</p>
                            <button 
                                onClick={() => document.documentElement.requestFullscreen()}
                                className="bg-white text-black font-black px-12 py-5 rounded-2xl hover:bg-gold transition-all uppercase tracking-widest text-sm"
                            >
                                Resume Secure Protocol
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center justify-between mb-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold border border-gold/20">
                                <HelpCircle size={24} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black italic gold-text-gradient uppercase tracking-tighter">Assessment in Progress</h4>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Time Elapsed</div>
                                <div className="text-2xl font-mono text-gold flex items-center gap-2">
                                    <Timer size={20} /> {formatTime(timeElapsed)}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-12">
                        <motion.div 
                            key={currentIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-10"
                        >
                            <h2 className="text-3xl lg:text-4xl font-black leading-tight text-white/90 italic">
                                &quot;{questions[currentIdx]?.text}&quot;
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {questions[currentIdx]?.options.map((option, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleOptionSelect(questions[currentIdx].id, idx)}
                                        className={`group relative p-6 rounded-3xl border cursor-pointer transition-all ${userAnswers[questions[currentIdx].id] === idx ? 'border-gold bg-gold/5 shadow-gold-glow/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors ${userAnswers[questions[currentIdx].id] === idx ? 'bg-gold text-black' : 'bg-white/10 text-white/40 group-hover:bg-white/20'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={`text-lg font-medium transition-colors ${userAnswers[questions[currentIdx].id] === idx ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                {option}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="flex items-center justify-between pt-10 border-t border-white/5">
                            <button 
                                disabled={currentIdx === 0}
                                onClick={() => setCurrentIdx(prev => prev - 1)}
                                className="text-sm font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors disabled:opacity-10"
                            >
                                Previous
                            </button>
                            
                            {currentIdx === questions.length - 1 ? (
                                <button 
                                    onClick={handleSubmit}
                                    className="bg-gold hover:bg-gold-dark text-black font-black px-12 py-5 rounded-2xl shadow-gold-glow uppercase tracking-widest text-sm flex items-center gap-3 active:scale-95"
                                >
                                    <Send size={18} /> Finalize Submission
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setCurrentIdx(prev => prev + 1)}
                                    className="bg-white hover:bg-gray-200 text-black font-black px-12 py-5 rounded-2xl uppercase tracking-widest text-sm active:scale-95 flex items-center gap-3"
                                >
                                    Next Question <Timer size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Proctoring Feed */}
            <aside className="w-[380px] bg-black border-l border-white/5 flex flex-col pt-12">
                <div className="px-8 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Live Feedback</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-600">ID: VDGR-SYS-X01</span>
                    </div>

                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-inner">
                        {!isCameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-600 gap-4 p-4 text-center">
                                <Camera size={40} strokeWidth={1.5} className={cameraError ? 'text-red-500' : ''} />
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest block">
                                        {cameraError || "No Active Stream"}
                                    </span>
                                    {cameraError && (
                                        <button 
                                            onClick={startCamera}
                                            className="text-[9px] font-black text-gold uppercase tracking-[0.2em] hover:underline flex items-center gap-2 mx-auto"
                                        >
                                            <RefreshCw size={10} /> Retry Access
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        <video 
                            ref={videoRefCallback} 
                            autoPlay 
                            muted 
                            playsInline 
                            onPlay={() => {
                                setIsCameraActive(true);
                                setCameraError(null);
                            }}
                            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`} 
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                            <div className="px-3 py-1 bg-black/60 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
                                <ShieldCheck size={12} className="text-gold" />
                                <span className="text-[8px] font-black text-gold uppercase tracking-tighter">AI Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 text-gray-400 group-hover:text-gold transition-colors">
                                    <AlertTriangle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Suspicion Index</span>
                                </div>
                                <span className={`text-sm font-black ${suspicionScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {suspicionScore}%
                                </span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-3">
                                <motion.div 
                                    className={`h-full ${suspicionScore > 50 ? 'bg-red-500' : 'bg-gold'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${suspicionScore}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={16} className={faceCount === 1 ? "text-emerald-500" : "text-red-500"} />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Face Detection</span>
                            </div>
                            <span className={`text-sm font-black ${faceCount === 1 ? 'text-emerald-500' : 'text-red-500'}`}>{faceCount} Detected</span>
                        </div>

                        <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <HelpCircle size={16} className={isTalking ? 'text-red-500 animate-pulse' : 'text-gray-500'} />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Speech Status</span>
                            </div>
                            <span className={`text-sm font-black ${isTalking ? 'text-red-500' : 'text-gray-400'}`}>
                                {isTalking ? 'TALKING' : 'SILENT'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 bg-gold/5 rounded-3xl border border-gold/10">
                        <h5 className="text-[10px] font-black text-gold uppercase tracking-widest mb-3">Cloud AI Integrity</h5>
                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic uppercase">
                            &quot;Assessment integrity verified via high-performance cloud computer vision. Real-time behavior analysis ensures a fair competition environment.&quot;
                        </p>
                    </div>
                </div>

                <div className="mt-auto p-12 opacity-20 text-center grayscale filter invert">
                    <CheckCircle2 size={40} className="mx-auto mb-4" />
                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">Cognitive Sandbox Secure</span>
                </div>
            </aside>
        </main>
    );
}

export default function ExamPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-gold" size={48} />
            </div>
        }>
            <ExamContent />
        </Suspense>
    );
}
