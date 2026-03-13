"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import { ShieldCheck, Building2, Search, Users, Trophy, BarChart3, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EmployerDashboard() {
    const { data: session } = useSession();
    const user = session?.user as any;

    if (user?.role !== "EMPLOYER") {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
                <ShieldCheck size={64} className="text-red-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-bold text-white mb-2">Unauthorized Access</h1>
                <p className="text-gray-400 max-w-md">This portal is reserved for verified employers and corporate partners.</p>
                <Link href="/login" className="mt-8 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background p-4 lg:p-12 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full -z-10" />

            <div className="max-w-7xl mx-auto pt-24">
                <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.2em] shadow-gold-glow">
                            <Building2 size={12} /> Recruitment Command Center
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                            Verified <span className="gold-text-gradient italic">Talent</span>.
                        </h1>
                        <p className="text-gray-400 text-lg font-medium max-w-xl">
                            Welcome, {user.email}. Manage your candidate pipeline with cryptographic certainty.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Quick Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass p-8 rounded-[2.5rem] border-white/5"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Active Candidates</h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest font-black">Syncing...</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-white">12</div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass p-8 rounded-[2.5rem] border-white/5"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Verified Degrees</h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest font-black">On-Chain</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-white">48</div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass p-8 rounded-[2.5rem] border-white/5"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Trust Score</h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest font-black">Network Avg</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-white">99.4%</div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-10 rounded-[3rem] border-white/5 relative overflow-hidden group"
                    >
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                                <Search size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Verify <span className="gold-text-gradient">Candidate</span></h2>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                Enter a student's Wallet Address or Digital Asset ID to instantly verify their academic credentials on the Algorand blockchain.
                            </p>
                            <Link 
                                href="/verify"
                                className="inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-gold transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Open Verifier Portal <ArrowRight size={16} />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-10 rounded-[3rem] border-gold/20 relative overflow-hidden group bg-gold/5"
                    >
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold ring-1 ring-gold/30">
                                <Zap size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Talent <span className="gold-text-gradient">Engine</span></h2>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                Use our BlindHire AI to filter candidates strictly by their cryptographic proofs, eliminating bias and focusing on verified excellence.
                            </p>
                            <button className="bg-gold text-black font-black px-8 py-4 rounded-2xl shadow-gold-glow animate-pulse text-xs uppercase tracking-widest">
                                Coming Soon
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
