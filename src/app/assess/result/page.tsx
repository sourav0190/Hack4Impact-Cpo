"use client";
import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, XCircle, ShieldCheck, ArrowRight, Zap, RefreshCw, BadgeCheck, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { mintSBT, algodClient, waitForConfirmation } from '@/lib/algorand';
import toast from 'react-hot-toast';

function ResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('status');
    const skillId = searchParams.get('skill');
    const score = searchParams.get('score');
    const time = searchParams.get('time');
    
    const { accountAddress, deflyWallet } = useWallet() as any;
    const [isMinting, setIsMinting] = useState(false);
    const [mintedAssetId, setMintedAssetId] = useState<number | null>(null);

    const isSuccess = status === 'success';
    const isTerminated = status === 'terminated';

    const formatTime = (seconds: string | null) => {
        if (!seconds) return "00:00";
        const s = parseInt(seconds);
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleClaimBadge = async () => {
        if (!accountAddress) return toast.error("Connect wallet to claim badge");
        
        setIsMinting(true);
        try {
            toast.loading("Minting Skill Badge on Algorand...", { id: "mint" });
            
            // In Phase 2, we simulate the University minting the badge for the student
            // For demo purposes, we'll use a placeholder IPFS link for the badge image
            const badgeMetaUrl = "ipfs://QmSkillBadgePlaceholder"; 
            
            // The University (creator) would usually sign this, but for the demo 
            // the student is "claiming" it (in a real app, this would be a backend process)
            const txn = await mintSBT(
                accountAddress, // In demo, student self-mints for simplicity
                accountAddress, 
                `${skillId?.toUpperCase()} Mastery Badge`, 
                badgeMetaUrl
            );

            const singleTxnGroups = [{ txn: txn, signers: [accountAddress] }];
            const signedTxn = await deflyWallet.signTransaction([singleTxnGroups]);
            
            const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
            const result = await waitForConfirmation(algodClient, txid, 4);
            
            setMintedAssetId(Number(result.assetIndex));
            toast.success(`Success! Skill Badge Minted: #${result.assetIndex}`, { id: "mint" });
        } catch (err: any) {
            console.error(err);
            toast.error("Minting failed: " + err.message, { id: "mint" });
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <main className="min-h-screen bg-background p-4 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className={`absolute inset-0 opacity-10 blur-[100px] rounded-full -z-10 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass p-12 lg:p-20 rounded-[4rem] text-center max-w-2xl border-white/5 relative"
            >
                {isTerminated ? (
                    <>
                        <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 mb-10 mx-auto ring-1 ring-red-500/20 shadow-red-glow">
                            <XCircle size={48} />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">
                            Assessment <span className="text-red-500">Terminated</span>
                        </h1>
                        <p className="text-gray-400 mb-12 font-medium">
                            Security violations exceeded the maximum threshold. This session has been voided due to AI-detected anomalies.
                        </p>
                        <button 
                            onClick={() => router.push('/assess')}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-sm"
                        >
                            <RefreshCw size={20} /> Request Retake
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-gold/10 rounded-[2.5rem] flex items-center justify-center text-gold mb-10 mx-auto ring-1 ring-gold/20 shadow-gold-glow">
                            <Trophy size={48} />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white mb-2 uppercase tracking-tighter italic">
                            Skill <span className="gold-text-gradient">Mastered</span>
                        </h1>
                        
                        <div className="flex items-center justify-center gap-8 mb-10">
                            <div className="text-center">
                                <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Accuracy</span>
                                <span className="text-3xl font-black text-white italic">{score}%</span>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Duration</span>
                                <span className="text-3xl font-black text-gold italic">{formatTime(time)}</span>
                            </div>
                        </div>

                        <p className="text-gray-400 mb-12 font-medium leading-relaxed">
                            Congratulations! You&apos;ve passed the AI-proctored evaluation for <span className="text-white font-bold">{skillId?.toUpperCase()}</span> with an impressive score. Your performance demonstrated high architectural competence.
                        </p>

                        <div className="space-y-4">
                            {!mintedAssetId ? (
                                <button 
                                    onClick={handleClaimBadge}
                                    disabled={isMinting}
                                    className="w-full bg-gold hover:bg-gold-dark text-black font-black py-6 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-gold-glow uppercase tracking-widest text-lg transform hover:-translate-y-1"
                                >
                                    {isMinting ? <Loader2 className="animate-spin" /> : <BadgeCheck size={28} />}
                                    Claim Skill Badge
                                </button>
                            ) : (
                                <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-3xl space-y-4">
                                    <div className="flex items-center justify-center gap-3 text-green-400">
                                        <ShieldCheck size={32} />
                                        <span className="text-2xl font-black"># {mintedAssetId}</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Immutable On-Chain Asset ID</p>
                                    <button 
                                        onClick={() => router.push('/dashboard')}
                                        className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200"
                                    >
                                        View in Vault
                                    </button>
                                </div>
                            )}

                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </>
                )}
            </motion.div>

            <footer className="mt-16 text-center space-y-4 opacity-30">
                <div className="flex justify-center gap-4 text-[10px] font-black tracking-[0.3em] uppercase text-white">
                    <span>V-DEGREE SECURE</span>
                    <span>•</span>
                    <span>AI PROCTOR LEVEL-04</span>
                </div>
            </footer>
        </main>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <ResultContent />
        </Suspense>
    );
}
