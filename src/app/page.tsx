"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    GraduationCap, 
    ShieldCheck, 
    Zap, 
    Lock, 
    Search, 
    ArrowRight, 
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
import Footer from '@/components/Footer';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
};

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-background selection:bg-gold/30 overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6">
                {/* Animated Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-gold/10 blur-[100px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    <motion.div 
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                        className="lg:col-span-7 space-y-8"
                    >
                        <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full ring-1 ring-gold/20 shadow-gold-glow">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Protocol V2.0 Live on Mainnet</span>
                        </motion.div>

                        <motion.h1 variants={fadeIn} className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
                            Trust, <br />
                            <span className="gold-text-gradient italic">Mathematically</span> <br />
                            Proven.
                        </motion.h1>

                        <motion.p variants={fadeIn} className="text-xl text-gray-400 max-w-xl leading-relaxed font-medium">
                            VeriDegree revolutionizes academic integrity using Algorand Soulbound Tokens and Zero-Knowledge Proofs. Secure issuance. Private verification.
                        </motion.p>

                        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-6 pt-4">
                            <Link href="/login" className="px-10 py-5 bg-gold hover:bg-gold-dark text-black font-black rounded-2xl transition-all shadow-gold-heavy flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95 text-lg uppercase tracking-tighter">
                                Launch Hub <ArrowRight size={20} />
                            </Link>
                            <Link href="#" className="px-10 py-5 glass hover:bg-white/5 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10 text-lg uppercase tracking-tighter">
                                Read Protocol
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Floating 3D Token Visual */}
                    <motion.div 
                        className="lg:col-span-5 relative hidden lg:block"
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                        <div className="relative aspect-square glass rounded-[4rem] flex items-center justify-center shadow-gold-heavy group">
                            <div className="absolute -inset-4 bg-gold/10 blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                            <motion.div 
                                animate={{ y: [0, -20, 0], rotateY: [0, 180, 360] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                className="w-48 h-48 bg-gradient-to-br from-gold/40 to-transparent rounded-3xl p-1 shadow-[0_0_50px_rgba(235,203,144,0.3)]"
                            >
                                <div className="w-full h-full glass rounded-2xl flex items-center justify-center">
                                    <GraduationCap size={80} className="text-gold" />
                                </div>
                            </motion.div>
                            
                            {/* Orbiting Stats */}
                            <div className="absolute top-10 -left-10 glass p-4 rounded-3xl animate-bounce">
                                <div className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">Status</div>
                                <div className="text-white font-black">UNREVOKABLE</div>
                            </div>
                            <div className="absolute bottom-10 -right-10 glass p-4 rounded-3xl delay-700 animate-pulse">
                                <div className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">Network</div>
                                <div className="text-white font-black">ALGORAND</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Bento Grid */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic lg:not-italic">Immutable <span className="text-gold">Infrastructure</span>.</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto font-medium">Built on the foundation of mathematical certainty and decentralization.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Featured Large Card */}
                        <motion.div 
                            whileHover={{ y: -10 }}
                            className="md:col-span-2 glass p-10 rounded-[3rem] relative overflow-hidden group border-gold/10"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] -z-10 group-hover:bg-gold/10 transition-all duration-700" />
                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-8 ring-1 ring-gold/20">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Algorand Soulbound Tokens</h3>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-lg font-medium">
                                Credentials are converted into non-transferable Smart Assets (SBTs), linking achievement to identity permanently without the possibility of fraud.
                            </p>
                            <div className="mt-12 flex items-center gap-2 text-gold font-bold uppercase tracking-widest text-xs">
                                <span>Security Level: Quantum-Resistant</span>
                                <div className="w-1 h-1 rounded-full bg-gold/30" />
                                <ChevronRight size={14} />
                            </div>
                        </motion.div>

                        {/* Smaller Bento Cards */}
                        <div className="space-y-8">
                            <motion.div whileHover={{ y: -10 }} className="glass p-8 rounded-[2.5rem] border-white/5">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gold mb-6 border border-white/5">
                                    <Lock size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2 tracking-tight">Zero-Knowledge Privacy</h4>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium">Users can prove qualification criteria without revealing their entire academic history.</p>
                            </motion.div>

                            <motion.div whileHover={{ y: -10 }} className="glass p-8 rounded-[2.5rem] border-white/5 bg-gold/5">
                                <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center text-gold mb-6">
                                    <Zap size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2 tracking-tight">Gasless Experience</h4>
                                <p className="text-gray-400 text-sm leading-relaxed font-medium">Universities handle the computational costs, providing a seamless Web2.5 UX for students.</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - Visual Stepper */}
            <section className="py-32 px-6 relative bg-white/[0.01]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-5 space-y-8">
                            <div className="inline-block px-4 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.3em]">
                                Workflow
                            </div>
                            <h2 className="text-5xl font-black text-white tracking-tighter leading-none">The Lifecycle of a <br /><span className="text-gold italic">VeriDegree</span>.</h2>
                            <p className="text-gray-400 text-lg font-medium leading-relaxed">
                                Our three-layer protocol ensures a seamless journey from graduation to employment.
                            </p>
                        </div>

                        <div className="lg:col-span-7 relative space-y-12">
                            {/* Vertical Line */}
                            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-gold via-gold/20 to-transparent hidden md:block" />

                            {[
                                { 
                                    step: "01", 
                                    title: "University Issuance", 
                                    desc: "Institution portal validates degree data and mints a secure SBT on Algorand.",
                                    Icon: GraduationCap 
                                },
                                { 
                                    step: "02", 
                                    title: "Student Claiming", 
                                    desc: "Students claim their asset and generate cryptographic ZK-Proofs for selective disclosure.",
                                    Icon: CheckCircle2 
                                },
                                { 
                                    step: "03", 
                                    title: "Instant Verification", 
                                    desc: "Recruiters scan the QR or check the hash for instantaneous, verifiable proof.",
                                    Icon: Search 
                                }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="relative pl-0 md:pl-20 group"
                                >
                                    <div className="absolute left-0 top-0 w-12 h-12 bg-black border border-gold/30 rounded-2xl flex items-center justify-center text-gold font-black z-10 group-hover:scale-110 transition-all shadow-gold-glow hidden md:flex">
                                        <item.Icon size={20} />
                                    </div>
                                    <div className="glass p-8 rounded-3xl group-hover:bg-white/[0.05] transition-all border-white/5 group-hover:border-gold/20">
                                        <span className="text-gold font-mono text-[10px] tracking-widest mb-2 block uppercase">Phase {item.step}</span>
                                        <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">{item.title}</h4>
                                        <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto glass p-12 md:p-24 rounded-[4rem] text-center space-y-10 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gold/5 blur-[100px] -z-10" />
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none italic">
                        Ready to <span className="text-gold lg:not-italic">Modernize</span> <br /> Academic Trust?
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                        <Link href="/login" className="px-12 py-6 bg-gold hover:bg-gold-dark text-black font-black rounded-3xl transition-all shadow-gold-heavy transform hover-translate-y-1 active:scale-95 text-xl uppercase tracking-tighter">
                            Get Started Now
                        </Link>
                    </div>
                </motion.div>
            </section>

            <Footer />
        </main>
    );
}
