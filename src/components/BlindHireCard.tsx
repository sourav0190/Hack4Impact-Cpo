"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ShieldCheck, UserCheck, FileText, ChevronRight, Zap, BadgeCheck, Link as LinkIcon, QrCode, Copy, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '@/lib/WalletContext';
import toast from 'react-hot-toast';

interface ProfileProject {
    name: string;
    description: string;
}

interface SanitizedProfile {
    title: string;
    skills: string[];
    experience: string;
    projects: ProfileProject[];
}

export default function BlindHireCard() {
    const { accountAddress } = useWallet() as any;
    const [resumeText, setResumeText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [sanitizedProfile, setSanitizedProfile] = useState<SanitizedProfile | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard!");
    };

    const handleGenerate = async () => {
        if (!resumeText.trim()) return toast.error("Please paste your resume text first");
        
        setIsGenerating(true);
        try {
            const res = await fetch('/api/sanitize-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText })
            });
            
            const data = await res.json();
            if (!res.ok) {
                const errMsg = data.error || "Failed to sanitize profile";
                throw new Error(errMsg);
            }
            
            setSanitizedProfile(data as SanitizedProfile);
            toast.success("AI Sanitization Complete!");
        } catch (error: any) {
            toast.error(error.message);
            console.error("BlindHire Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-[2.5rem] border-gold/20 relative overflow-hidden"
            >
                {/* Background Sparkle */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold ring-1 ring-gold/30 shadow-gold-glow">
                                <Sparkles size={28} className="fill-gold/20" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                                    BlindHire <span className="gold-text-gradient">AI</span>
                                </h3>
                                <div className="text-[10px] font-black text-gold/60 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Zap size={10} className="fill-gold" /> Anti-Bias Recruitment Synthesis
                                </div>
                            </div>
                        </div>

                        {!sanitizedProfile && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <ShieldCheck size={12} className="text-green-500" /> PII Protection Active
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {!sanitizedProfile ? (
                            <motion.div 
                                key="input-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-2xl">
                                    Our AI strips your name, gender, location, and specific entities to ensure recruiters judge you 
                                    <span className="text-white"> purely on talent.</span> Paste your raw resume text below to generate your anonymous profile.
                                </p>
                                
                                <div className="relative group">
                                    <textarea 
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                        placeholder="Paste your resume content here (Skills, Experience, Projects...)"
                                        className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-6 text-white text-sm outline-none focus:border-gold/30 transition-all placeholder:text-gray-700 font-medium resize-none shadow-inner"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-600">
                                        Secure AI Processing
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full md:w-auto bg-gold hover:bg-gold-dark text-black font-black px-12 py-5 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-gold-glow uppercase tracking-widest text-sm disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <><Loader2 size={20} className="animate-spin" /> Sanitizing Profile...</>
                                    ) : (
                                        <><UserCheck size={20} /> Generate Anonymous Profile</>
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="result-state"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Profile Summary */}
                                    <div className="lg:col-span-12 p-6 bg-white/5 rounded-[2rem] border border-white/10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <BadgeCheck className="text-gold" size={20} />
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest">{sanitizedProfile.title}</h4>
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium leading-relaxed italic">
                                            "{sanitizedProfile.experience}"
                                        </p>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Zap size={12} className="text-gold" /> Core Competencies
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {sanitizedProfile.skills.map((skill, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-xl text-gold font-bold text-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Projects Section */}
                                    <div className="lg:col-span-7 space-y-4">
                                        <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <FileText size={12} className="text-gold" /> Sanitized Projects
                                        </h5>
                                        <div className="space-y-3">
                                            {sanitizedProfile.projects.map((project, idx) => (
                                                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-gold/30 transition-all shadow-lg hover:shadow-gold-glow/5">
                                                    <h6 className="text-white font-bold text-sm mb-1">{project.name}</h6>
                                                    <p className="text-gray-500 text-xs leading-relaxed">{project.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-white/5 items-center">
                                    <button 
                                        onClick={() => setSanitizedProfile(null)}
                                        className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <ChevronRight size={14} className="rotate-180" /> Regenerate Profile
                                    </button>
                                    <div className="flex-1" />
                                    
                                    <button 
                                        onClick={() => {
                                            if(!accountAddress) {
                                                toast.error("Please connect your wallet first");
                                                return;
                                            }
                                            setIsShareModalOpen(true);
                                        }}
                                        className="bg-gold hover:bg-gold-dark text-black font-black px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-gold-glow uppercase tracking-widest text-[10px]"
                                    >
                                        <LinkIcon size={14} /> Publish & Generate Smart Link
                                    </button>

                                    <div className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2 bg-green-500/10 px-4 py-2.5 rounded-xl ring-1 ring-green-500/20">
                                        <ShieldCheck size={14} /> Recruitment Ready
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Share Modal */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass border-gold/30 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-gold-glow"
                        >
                            <button 
                                onClick={() => setIsShareModalOpen(false)} 
                                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 ring-1 ring-gold/30 shadow-gold-glow">
                                    <QrCode size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-2">
                                    Your Anonymous Profile is Live
                                </h2>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
                                    Recruiters scanning this QR will only see your verified skills and ZK-Proof, ensuring 100% bias-free hiring.
                                </p>

                                <div className="bg-white p-4 rounded-[2rem] shadow-2xl mb-8">
                                    <QRCodeSVG 
                                        value={typeof window !== 'undefined' ? `${window.location.origin}/verify?candidateId=${accountAddress}` : ''} 
                                        size={180}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                <button 
                                    onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/verify?candidateId=${accountAddress}` : '')}
                                    className="w-full bg-white hover:bg-gold hover:text-black text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                                >
                                    <Copy size={16} /> Copy Shareable Link
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
