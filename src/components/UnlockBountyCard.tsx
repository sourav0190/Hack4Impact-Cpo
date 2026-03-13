"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Loader2, Coins, ArrowRight, ShieldCheck, Mail, Phone, Globe } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { executeTalentBounty } from '@/lib/algorand';
import toast from 'react-hot-toast';

interface UnlockBountyCardProps {
    studentAddress: string;
    universityAddress: string;
}

export default function UnlockBountyCard({ studentAddress, universityAddress }: UnlockBountyCardProps) {
    const { accountAddress, deflyWallet, connect } = useWallet() as any;
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [txId, setTxId] = useState<string | null>(null);

    const handleUnlock = async () => {
        let currentAddress = accountAddress;
        
        if (!currentAddress) {
            toast.loading("Please connect your wallet to proceed...", { id: "bounty-connect" });
            currentAddress = await connect();
            toast.dismiss("bounty-connect");
            if (!currentAddress) return; // User cancelled connection
        }
        
        setIsUnlocking(true);
        try {
            toast.loading("Initiating Atomic Transfer...", { id: "bounty" });
            const confirmedTxId = await executeTalentBounty(
                currentAddress, 
                studentAddress, 
                universityAddress, 
                deflyWallet
            );
            
            setTxId(confirmedTxId);
            setIsUnlocked(true);
            toast.success("Bounty Paid. Profile Unlocked!", { id: "bounty" });
        } catch (error: any) {
            console.error("Bounty Error:", error);
            toast.error(error.message || "Failed to execute bounty transfer.", { id: "bounty" });
        } finally {
            setIsUnlocking(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-white/10">
            <h4 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Coins className="text-gold" size={24} /> Talent-Fi Recruitment
            </h4>

            <AnimatePresence mode="wait">
                {!isUnlocked ? (
                    <motion.div 
                        key="locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden"
                    >
                        {/* Blurred Content Presentation */}
                        <div className="space-y-4 filter blur-md select-none opacity-50 pointer-events-none">
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                <Mail size={20} className="text-gold" />
                                <div className="h-4 bg-white/20 rounded w-48"></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                <Phone size={20} className="text-gold" />
                                <div className="h-4 bg-white/20 rounded w-32"></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                <Globe size={20} className="text-gold" />
                                <div className="h-4 bg-white/20 rounded w-64"></div>
                            </div>
                        </div>

                        {/* Lock Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 p-6 text-center">
                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 ring-1 ring-gold/30 shadow-gold-glow">
                                <Lock size={32} />
                            </div>
                            <h5 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Candidate Contact Locked</h5>
                            <p className="text-gray-400 text-sm mb-8 max-w-sm">
                                Pay the 5 ALGO Talent Bounty to instantly access this verified candidate's direct contact information.
                            </p>

                            <button 
                                onClick={handleUnlock}
                                disabled={isUnlocking}
                                className="w-full max-w-sm bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-400 hover:to-gold text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-gold/20 uppercase tracking-widest text-sm"
                            >
                                {isUnlocking ? (
                                    <><Loader2 className="animate-spin" size={20} /> Processing Atomic Split...</>
                                ) : (
                                    <><Unlock size={20} /> Unlock Full Profile (5 ALGO)</>
                                )}
                            </button>
                            <div className="mt-4 text-[10px] font-mono text-gold/80 uppercase tracking-widest flex items-center gap-2">
                                <ArrowRight size={12} /> Atomic Split: 4 ALGO to Candidate, 1 ALGO to University
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="unlocked"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-[2.5rem] border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 ring-1 ring-green-500/30">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h5 className="text-lg font-black text-white uppercase tracking-tight">Contact Information Unlocked</h5>
                                {txId && (
                                <a 
                                    href={`https://testnet.algoexplorer.io/tx/${txId}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[10px] font-mono text-gold uppercase tracking-widest hover:underline"
                                >
                                    Transaction Verified: {txId.slice(0,12)}...
                                </a>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 cursor-copy select-all">
                                <Mail size={20} className="text-gold" />
                                <span className="text-white font-medium text-sm">verified.candidate@example.edu</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 cursor-copy select-all">
                                <Phone size={20} className="text-gold" />
                                <span className="text-white font-medium text-sm">+1 (555) 019-9234</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 cursor-copy select-all">
                                <Globe size={20} className="text-gold" />
                                <span className="text-white font-medium text-sm">github.com/verified-candidate</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
