"use client";
import React, { useState } from 'react';
import { SKILL_CATEGORIES } from '@/lib/questions';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Zap, Target, BookOpen, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AssessPage() {
    const router = useRouter();
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'hard'>('beginner');

    const handleStartExam = () => {
        if (!selectedSkill) return;
        router.push(`/assess/exam?skill=${selectedSkill}&difficulty=${difficulty}`);
    };

    return (
        <main className="min-h-screen bg-background p-4 lg:p-12 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10" />

            <div className="max-w-6xl mx-auto pt-24">
                <header className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 glass border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-gold-glow"
                    >
                        <ShieldCheck size={12} className="fill-gold" /> AI Proctoring Security Level-04
                    </motion.div>
                    
                    <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.8]">
                        Skill <span className="gold-text-gradient italic">Assessment</span>.
                    </h1>
                    
                    <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">
                        Verify your technical expertise through our AI-proctored evaluation engine and earn on-chain skill badges.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Skill Selection */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                <Target size={16} className="text-gold" /> Available Domains
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {SKILL_CATEGORIES.map((skill) => (
                                <motion.div
                                    key={skill.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedSkill(skill.id)}
                                    className={`relative glass p-8 rounded-[2.5rem] cursor-pointer transition-all border ${selectedSkill === skill.id ? 'border-gold shadow-gold-glow' : 'border-white/5 hover:border-gold/30'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${selectedSkill === skill.id ? 'bg-gold text-black' : 'bg-white/5 text-gold'}`}>
                                        <BookOpen size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">{skill.name}</h3>
                                    <p className="text-sm text-gray-400 font-medium leading-relaxed">{skill.description}</p>
                                    
                                    {selectedSkill === skill.id && (
                                        <motion.div 
                                            layoutId="check"
                                            className="absolute top-6 right-6 text-gold"
                                        >
                                            <Zap size={24} className="fill-gold" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Difficulty & Start */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="glass p-10 rounded-[3rem] border-white/5 sticky top-32">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3 italic">
                                <Sparkles size={20} className="text-gold" /> Assessment <span className="gold-text-gradient">Config</span>
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Complexity Level</label>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'beginner', label: 'Beginner', desc: 'Core Fundamentals', icon: '🌱' },
                                            { id: 'intermediate', label: 'Intermediate', desc: 'Professional Patterns', icon: '🚀' },
                                            { id: 'hard', label: 'Senior', desc: 'Architectural Mastery', icon: '🏛️' }
                                        ].map((level) => (
                                            <div
                                                key={level.id}
                                                onClick={() => setDifficulty(level.id as any)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${difficulty === level.id ? 'bg-gold/10 border-gold/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{level.icon}</span>
                                                    <div>
                                                        <div className={`text-sm font-black uppercase tracking-tight ${difficulty === level.id ? 'text-gold' : 'text-white'}`}>{level.label}</div>
                                                        <div className="text-[10px] font-bold text-gray-500 uppercase">{level.desc}</div>
                                                    </div>
                                                </div>
                                                {difficulty === level.id && <ChevronRight size={16} className="text-gold" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                        <ShieldCheck size={18} className="text-red-500 mt-1 flex-shrink-0" />
                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-wider">
                                            AI Proctoring will monitor your camera feed & environment. Tab switching is strictly prohibited.
                                        </p>
                                    </div>

                                    <button
                                        disabled={!selectedSkill}
                                        onClick={handleStartExam}
                                        className="w-full bg-gold hover:bg-gold-dark disabled:opacity-30 disabled:cursor-not-allowed text-black font-black py-5 rounded-[1.8rem] transition-all flex items-center justify-center gap-3 shadow-gold-glow uppercase tracking-[0.2em] text-sm"
                                    >
                                        Initialize Protocol <ArrowRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-24 text-center space-y-4 opacity-40">
                    <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white">Trust but Verify • Automated Cognitive Assesment Node-09</p>
                </footer>
            </div>
        </main>
    );
}
