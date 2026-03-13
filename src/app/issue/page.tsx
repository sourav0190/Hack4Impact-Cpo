"use client";
import React, { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useWallet } from '@/lib/WalletContext';
import { algodClient, mintSBT, cleanAddress, waitForConfirmation, transferAsset } from "@/lib/algorand";
import { uploadJSONToIPFS } from '@/lib/ipfs';
import { GraduationCap, User, FileText, BarChart, Send, Loader2, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export interface StudentData {
    studentName: string;
    enrollmentId: string;
    studentAddr: string;
    degree: string;
    cgpa: string;
    gradYear: number;
}

export interface Credential extends StudentData {
    issuer: string;
    type: string;
    timestamp: string;
}

export default function IssuePage() {
    const { data: session } = useSession();
    const { accountAddress, connect, deflyWallet } = useWallet() as {
        accountAddress: string;
        connect: () => void;
        deflyWallet: any; // Type according to defly specifications if available
    };

    const [formData, setFormData] = useState<StudentData>({
        studentName: '',
        enrollmentId: '',
        studentAddr: '',
        degree: '',
        cgpa: '',
        gradYear: (new Date()).getFullYear(),
    });

    const [isIssuing, setIsIssuing] = useState<boolean>(false);
    const [mintedAssetId, setMintedAssetId] = useState<number | bigint | null>(null);
    const [isTransferring, setIsTransferring] = useState<boolean>(false);

    const handleTransfer = async () => {
        if (!mintedAssetId || !formData.studentAddr) return;
        setIsTransferring(true);
        try {
            toast.loading("Initiating Transfer...", { id: "transfer" });
            const sAddr = cleanAddress(formData.studentAddr);
            const cAddr = cleanAddress(accountAddress);

            const txn = await transferAsset(cAddr, sAddr, mintedAssetId);
            const singleTxnGroups = [{ txn: txn, signers: [cAddr] }];
            
            toast.loading("Sign Transfer in Defly...", { id: "transfer" });
            const signedTxn = await deflyWallet.signTransaction([singleTxnGroups]);
            
            toast.loading("Broadcasting Transfer...", { id: "transfer" });
            const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
            
            toast.loading("Confirming Transfer...", { id: "transfer" });
            await waitForConfirmation(algodClient, txid, 4);

            toast.success("Degree Successfully Transferred to Student!", { id: "transfer", duration: 5000 });
            setMintedAssetId(null);
            setFormData({ studentName: '', enrollmentId: '', studentAddr: '', degree: '', cgpa: '', gradYear: 2026 });
        } catch (error: any) {
            console.error("Transfer error:", error);
            toast.error("Transfer failed: " + (error?.message || "Ensure student has opted in"), { id: "transfer" });
        } finally {
            setIsTransferring(false);
        }
    };

    const handleIssue = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("[DEBUG] handleIssue clicked. current accountAddress:", accountAddress);

        if (!accountAddress) {
            toast.error("Connect your Defly Wallet first!");
            return;
        }
        
        setIsIssuing(true);
        try {
            // 1. Upload to IPFS
            toast.loading("Uploading metadata to IPFS...", { id: "issue" });
            const metadata: Credential = {
                ...formData,
                issuer: accountAddress,
                type: "VeriDegree SBT",
                timestamp: new Date().toISOString()
            };
            const ipfsHash = await uploadJSONToIPFS(metadata);
            const assetUrl = `ipfs://${ipfsHash}`;
            console.log("[DEBUG] IPFS Upload success:", assetUrl);

            // 2. Prepare Mint Txn
            toast.loading("Building Algorand Transaction...", { id: "issue" });
            
            if (typeof cleanAddress !== 'function') {
                console.error("[CRITICAL] cleanAddress is not a function! Scope check:", { cleanAddress });
                throw new Error("Internal Error: Wallet utility 'cleanAddress' is missing. Please refresh the page.");
            }

            const sAddr = cleanAddress(formData.studentAddr);
            const cAddr = cleanAddress(accountAddress);
            const sName = String(formData.studentName || "").trim();

            console.log("[DEBUG_V3] Cleaned Inputs:", { cAddr, sAddr, sName });

            if (!sAddr) throw new Error("Invalid student address format");
            if (!cAddr) throw new Error("Please reconnect your wallet - invalid address detected");

            const txn = await mintSBT(
                cAddr, 
                sAddr, 
                `${sName}'s Degree`, 
                assetUrl
            );

            // 3. Sign with Defly
            toast.loading("Approve in your Defly App...", { id: "issue" });
            const singleTxnGroups = [{ txn: txn, signers: [cAddr] }];
            const signedTxn = await deflyWallet.signTransaction([singleTxnGroups]);
            console.log("[DEBUG] Transaction signed successfully");
            
            // 4. Send Txn
            toast.loading("Broadcasting Transaction...", { id: "issue" });
            const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
            console.log("[DEBUG] Broadcasted! TxId:", txid);
            
            // 5. Wait for Confirmation
            toast.loading("Waiting for confirmation...", { id: "issue" });
            const result = await waitForConfirmation(algodClient, txid, 4);
            const assetIndex = result.assetIndex;

            toast.success(`Minted! Asset ID: ${assetIndex}. Waiting for student opt-in.`, { id: "issue", duration: 8000 });
            setMintedAssetId(assetIndex);
            // Don't clear form data yet, we need it for the transfer step
        } catch (error: any) {
            console.error("[CRITICAL] handleIssue error:", error);
            toast.error("Process Failed: " + (error?.message || "Unknown error"), { id: "issue" });
        } finally {
            setIsIssuing(false);
        }
    };

    // RBAC Check (assuming custom session type with role)
    const user = session?.user as { role?: string } | undefined;
    if (user?.role !== "UNIVERSITY") {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
                <ShieldCheck size={64} className="text-red-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
                <p className="text-gray-400 max-w-md">Only verified University Administrators can access the issuance portal.</p>
                <Link href="/login" className="mt-8 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                    Return to Login
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background p-4 lg:p-12 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10" />

            <div className="max-w-4xl mx-auto pt-24">
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-20 text-center"
                >
                    <div className="w-20 h-20 bg-gold/10 rounded-[2.5rem] flex items-center justify-center text-gold mb-8 ring-1 ring-gold/20 shadow-gold-glow">
                        <GraduationCap size={44} />
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6 uppercase">
                        Institution <span className="gold-text-gradient italic">Portal</span>.
                    </h1>
                    <p className="text-gray-400 text-lg font-medium max-w-2xl leading-relaxed">
                        Securely issue immutable soulbound academic credentials on the Algorand blockchain with mathematical certainty.
                    </p>
                </motion.header>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative group"
                >
                    <div className="absolute -inset-1 bg-gold/20 blur-3xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                    
                    <div className="relative glass p-8 lg:p-16 rounded-[4rem] shadow-2xl overflow-hidden border-white/5">
                        {!accountAddress ? (
                            /* State A: Wallet Not Connected */
                            <div className="py-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                                    <Wallet size={32} className="text-white/60" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Authentication Successful</h2>
                                <p className="text-gray-400 max-w-md mb-10 leading-relaxed">
                                    Welcome back, Administrator. Please connect your institution's Algorand wallet to begin minting secure credentials.
                                </p>
                                <button 
                                    onClick={connect}
                                    className="bg-gold hover:bg-gold-dark text-black font-black px-12 py-5 rounded-2xl transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(235,203,144,0.2)]"
                                >
                                    <Wallet size={20} />
                                    Connect Institution Wallet
                                </button>
                                <div className="mt-12 flex items-center gap-4 opacity-30 grayscale pointer-events-none">
                                    <div className="h-px w-12 bg-white/20"></div>
                                    <span className="text-[10px] font-mono tracking-widest text-white uppercase">Vault Locked</span>
                                    <div className="h-px w-12 bg-white/20"></div>
                                </div>
                            </div>
                        ) : (
                            /* State B: Wallet Connected - Form Unlocked */
                            <div className="animate-in fade-in duration-1000">
                                {/* Connection Status Bar */}
                                <div className="flex flex-col sm:flex-row items-center justify-between mb-12 p-4 bg-white/5 border border-white/10 rounded-2xl gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                                            Minting as: <span className="text-gold font-bold">{accountAddress.slice(0, 8)}...{accountAddress.slice(-8)}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full">
                                        <ShieldCheck size={12} className="text-gold" />
                                        <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">Verified Issuer</span>
                                    </div>
                                </div>

                                <form onSubmit={handleIssue} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                <User size={14} /> Student Meta-Identity
                                            </label>
                                            <input 
                                                required
                                                value={formData.studentName}
                                                onChange={e => setFormData({...formData, studentName: e.target.value})}
                                                className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl focus:border-gold/30 focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/10 font-medium"
                                                placeholder="Legal Name of Student"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                <FileText size={14} /> Enrollment ID / Roll Number
                                            </label>
                                            <input 
                                                required
                                                value={formData.enrollmentId}
                                                onChange={e => setFormData({...formData, enrollmentId: e.target.value})}
                                                className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl focus:border-gold/30 focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/10 font-mono text-sm tracking-widest uppercase"
                                                placeholder="e.g. CS-2026-042"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                <Wallet size={14} /> Algorand Resolve Address
                                            </label>
                                            <input 
                                                required
                                                value={formData.studentAddr}
                                                onChange={e => setFormData({...formData, studentAddr: e.target.value})}
                                                className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl focus:border-gold/30 focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/10 font-mono text-xs"
                                                placeholder="ALGO Address..."
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                <GraduationCap size={14} /> Academic Degree
                                            </label>
                                            <input 
                                                required
                                                value={formData.degree}
                                                onChange={e => setFormData({...formData, degree: e.target.value})}
                                                className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl focus:border-gold/30 focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/10 font-medium"
                                                placeholder="e.g. Master of Computer Science"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                <BarChart size={14} /> Transcript CGPA
                                            </label>
                                            <input 
                                                required
                                                type="number" step="0.01"
                                                value={formData.cgpa}
                                                onChange={e => setFormData({...formData, cgpa: e.target.value})}
                                                className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl focus:border-gold/30 focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/10 font-medium"
                                                placeholder="0.00 / 10.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] ml-1 text-nowrap">Conferred Year</label>
                                        <input 
                                            required
                                            type="number"
                                            value={formData.gradYear}
                                            onChange={e => setFormData({...formData, gradYear: Number(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl focus:border-gold/30 focus:bg-white/10 outline-none transition-all text-white font-medium"
                                        />
                                    </div>

                                    <button 
                                        disabled={isIssuing}
                                        className="w-full bg-gold hover:bg-gold-dark disabled:opacity-30 disabled:cursor-not-allowed text-black font-black py-6 rounded-2xl flex items-center justify-center gap-4 transition-all mt-10 shadow-[0_10px_40px_rgba(235,203,144,0.15)] hover:shadow-[0_20px_50px_rgba(235,203,144,0.3)] transform hover:-translate-y-1 active:translate-y-0 text-xl uppercase tracking-tighter"
                                    >
                                        {isIssuing ? (
                                            <>
                                                <Loader2 className="animate-spin" size={24} />
                                                <span>Executing Mint Transaction...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                Mint Soulbound Degree
                                            </>
                                        )}
                                    </button>

                                    {mintedAssetId && (
                                        <div className="mt-12 p-8 bg-gold/5 border border-gold/20 rounded-3xl text-center space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShieldCheck size={40} className="text-gold mb-2" />
                                                <h3 className="text-2xl font-bold text-white tracking-tight">Success: #{mintedAssetId}</h3>
                                                <p className="text-gray-400 text-sm max-w-sm">
                                                    The SBT has been minted. Please advise the student to <span className="text-white font-bold underline underline-offset-4 decoration-gold/50 cursor-pointer">Opt-in</span> from their vault.
                                                </p>
                                            </div>
                                            
                                            <button
                                                type="button"
                                                onClick={handleTransfer}
                                                disabled={isTransferring}
                                                className="w-full bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all text-sm uppercase"
                                            >
                                                {isTransferring ? (
                                                    <Loader2 className="animate-spin" size={20} />
                                                ) : (
                                                    <Send size={20} />
                                                )}
                                                Finalize Transfer Protocol
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </motion.div>

                <footer className="mt-16 text-center space-y-4 opacity-30">
                    <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-white">Immutable Academic Ledger Node-01</p>
                    <div className="flex justify-center gap-4 text-xs font-bold text-gray-500">
                        <span>Algorand Mainnet Integration</span>
                        <span>•</span>
                        <span>ZK-SNARK Verification Ready</span>
                    </div>
                </footer>
            </div>
        </main>
    );
}
