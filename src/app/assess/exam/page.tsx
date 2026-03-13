"use client";
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SKILL_CATEGORIES, Question } from '@/lib/questions';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, Camera, Maximize2, AlertTriangle, CheckCircle2, XCircle, Send, Timer, HelpCircle, ShieldCheck, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

// MediaPipe imports
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';

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
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const modelRef = useRef<ObjectDetector | null>(null);
    const warningCooldown = useRef(0);

    // Warning System
    const forceSubmit = useCallback(() => {
        toast.error("TEST TERMINATED: Multiple security violations detected.", { duration: 10000 });
        // In a real app, we'd submit current data to DB here
        router.push('/assess/result?status=terminated');
    }, [router]);

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

        const loadModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                modelRef.current = await ObjectDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
                        delegate: "GPU"
                    },
                    scoreThreshold: 0.5,
                    runningMode: "VIDEO"
                });
                console.log("[AI] MediaPipe Model Created Successfully");
                setIsModelLoading(false);
            } catch (err) {
                console.error("MediaPipe Load Error:", err);
                toast.error("Failed to initialize AI Proctoring engine");
            }
        };
        loadModel();

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

    // Dedicated Camera Stream Cleanup (ONLY on Unmount)
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                console.log("[CAMERA] Component unmounting. Stopping all tracks:", streamRef.current.id);
                streamRef.current.getTracks().forEach(track => {
                    console.log(`[CAMERA] Stopping track: ${track.kind} (${track.label})`);
                    track.stop();
                });
            }
        };
    }, []);

    // Handle video attachment when it mounts
    const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
        console.log("[CAMERA] videoRefCallback called with node:", node ? "HTMLVideoElement" : "null");
        if (node !== null) {
            // Save to ref for detection loop
            (videoRef as any).current = node;
            
            // Attach stream if it exists
            if (streamRef.current) {
                if (!node.srcObject) {
                    console.log("[CAMERA] Attaching existing stream to video node");
                    node.srcObject = streamRef.current;
                    setIsCameraActive(true);
                    node.play().catch(e => console.error("[CAMERA] Play error:", e));
                } else {
                    console.log("[CAMERA] Video node already has a srcObject");
                }
            } else {
                console.warn("[CAMERA] No stream available in streamRef to attach");
            }
        }
    }, []);



    // Camera & Detection Loop
    useEffect(() => {
        let animationFrame: number;
        
        const detect = async () => {
            if (modelRef.current && videoRef.current && videoRef.current.readyState === 4 && isStarted) {
                try {
                    const result = modelRef.current.detectForVideo(videoRef.current, performance.now());
                    const persons = result.detections.filter(d => 
                        d.categories.some(c => c.categoryName === 'person' && c.score > 0.4)
                    );
                    
                    if (persons.length > 0) {
                        // console.log(`[AI] ${persons.length} person(s) detected`);
                    }

                    setFaceCount(persons.length);

                    if (persons.length > 1) {
                        issueWarning("Multiple People Detected in Frame!");
                    }
                } catch (err) {
                    console.error("[AI] Detection Error:", err);
                }
            }
            animationFrame = requestAnimationFrame(detect);
        };

        if (isStarted && !isModelLoading) {
            console.log("[AI PROCTOR] Detection Loop Started");
            detect();
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [isStarted, isModelLoading, issueWarning]);

    const startCamera = async () => {
        try {
            console.log("[CAMERA] Requesting user media...");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 320, height: 240 } 
            });
            console.log("[CAMERA] Stream obtained:", stream.id, "Active Tracks:", stream.getVideoTracks().length);
            streamRef.current = stream;
            
            // Note: videoRef.current might be null at this point due to conditional rendering
            if (videoRef.current) {
                console.log("[CAMERA] Attaching stream to existing video ref");
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            } else {
                console.log("[CAMERA] Video element not yet mounted, will attach via callback");
            }
        } catch (err) {
            console.error("[CAMERA] getUserMedia Error:", err);
            toast.error("Camera access required for proctored exam. Please check permissions.");
        }
    };

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
        // Calculate score
        let correctCount = 0;
        questions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });
        const score = Math.round((correctCount / questions.length) * 100);

        toast.success("Exam Submitted Successfully!");
        router.push(`/assess/result?status=success&skill=${skillId}&score=${score}&time=${timeElapsed}`);
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
                            <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-600 gap-2">
                                <Camera size={40} strokeWidth={1.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest">No Active Stream</span>
                            </div>
                        )}
                        <video 
                            ref={videoRefCallback} 
                            autoPlay 
                            muted 
                            playsInline 
                            onPlay={() => setIsCameraActive(true)}
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
                        <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Loader2 size={16} className={`text-gold ${isModelLoading ? 'animate-spin' : ''}`} />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Load</span>
                            </div>
                            <span className="text-xs font-bold text-white uppercase">{isModelLoading ? 'Syncing' : 'Stabilized'}</span>
                        </div>

                        <div className={`flex justify-between items-center p-5 rounded-2xl border transition-colors ${warnings > 0 ? 'bg-red-500/10 border-red-500/20 shadow-red-glow/20' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={16} className={warnings > 0 ? 'text-red-500' : 'text-gray-500'} />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Warnings</span>
                            </div>
                            <span className={`text-sm font-black ${warnings > 1 ? 'text-red-500 animate-pulse' : warnings > 0 ? 'text-orange-500' : 'text-white'}`}>{warnings}/3</span>
                        </div>

                        <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={16} className="text-green-500" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Face Detection</span>
                            </div>
                            <span className={`text-sm font-black ${faceCount === 1 ? 'text-green-500' : 'text-red-500'}`}>{faceCount} Detected</span>
                        </div>
                    </div>

                    <div className="p-6 bg-gold/5 rounded-3xl border border-gold/10">
                        <h5 className="text-[10px] font-black text-gold uppercase tracking-widest mb-3">System Note</h5>
                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic uppercase">
                            &quot;Assessment integrity verified via on-device inference. Data never leaves your machine. Full anonymity maintained while preventing collusion.&quot;
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
