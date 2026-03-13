"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/WalletContext';
import { cleanAddress } from '@/lib/algorand';
import { ShieldCheck, Loader2, Search, PlusCircle, CheckCircle, Copy, Code, Github, X, QrCode, Download, ExternalLink, RefreshCw, Wallet, Info, GraduationCap, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ZKProofModal = dynamic(() => import('@/components/ZKProofModal'), { ssr: false });
const CertificateCard = dynamic(() => import('@/components/CertificateCard'), { ssr: false });
const BlindHireCard = dynamic(() => import('@/components/BlindHireCard'), { ssr: false });

interface Asset {
    id: string;
    amount: number;
    name?: string;
    url?: string;
    creator?: string;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { accountAddress, connect, deflyWallet } = useWallet() as any;
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
    const [sharingAsset, setSharingAsset] = useState<Asset | null>(null);
    
    // Opt-in state
    const [claimAssetId, setClaimAssetId] = useState<string>('');
    const [isClaiming, setIsClaiming] = useState<boolean>(false);

    // Profile Setup State
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const loadAssets = React.useCallback(async () => {
        if (!accountAddress) return;
        setIsLoading(true);
        try {
            console.log(`[VAULT] Requesting assets for: ${accountAddress}`);
            const response = await fetch(`/api/assets?address=${accountAddress}`);
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            console.log(`[VAULT] Received ${data.assets?.length || 0} education assets from API`);
            setAssets(data.assets || []);
        } catch (error: any) {
            console.error("Dashboard Load Error:", error);
            toast.error("Failed to load Vault assets");
        } finally {
            setIsLoading(false);
        }
    }, [accountAddress]);

    useEffect(() => {
        if (accountAddress) {
            loadAssets();
            checkProfile();
        } else {
            setAssets([]);
        }
    }, [accountAddress, loadAssets]);

    const checkProfile = async () => {
        try {
            const res = await fetch('/api/student/profile');
            const data = await res.json();
            if (data.needsSetup) {
                setShowProfileSetup(true);
            } else {
                setProfileData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || ''
                });
            }
        } catch (err) {
            console.error("Profile check failed");
        }
    };

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const res = await fetch('/api/student/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (res.ok) {
                toast.success("Professional Profile Synchronized");
                setShowProfileSetup(false);
            } else {
                throw new Error("Sync failed");
            }
        } catch (err) {
            toast.error("Profile Synchronization Failed");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleOpenProofModal = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsModalOpen(true);
    };

    const handleOpenShareBadge = (asset: Asset) => {
        setSharingAsset(asset);
        setIsShareModalOpen(true);
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${type} snippet copied!`);
    };

    const downloadQRCode = () => {
        const svg = document.getElementById('qr-code-svg') as (HTMLElement & SVGElement) | null;
        if (!svg || !sharingAsset) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 40;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 20, 20);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `VeriDegree_QR_${sharingAsset.id}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            toast.success("QR Code downloaded!");
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const handleClaim = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!claimAssetId || !accountAddress) return;

        setIsClaiming(true);
        try {
            toast.loading("Preparing Cryptographic Opt-in...", { id: "claim" });
            
            // 1. Get Unsigned Txn from API
            const response = await fetch('/api/assets/opt-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: accountAddress,
                    assetId: claimAssetId
                })
            });
            const { txn: encodedTxn, error } = await response.json();
            if (error) throw new Error(error);

            toast.loading("Awaiting Wallet Signature...", { id: "claim" });
            
            // 2. Convert base64 to Uint8Array for Defly
            const txnBytes = new Uint8Array(atob(encodedTxn).split("").map(c => c.charCodeAt(0)));
            
            // 3. Sign using Defly (WalletContext provides deflyWallet)
            const singleTxnGroups = [{ txn: txnBytes, signers: [accountAddress] }];
            const signedResult = await (deflyWallet as any).signTransaction([singleTxnGroups]) as Uint8Array[];
            const signedTxn = signedResult[0];
            
            toast.loading("Verifying on Algorand...", { id: "claim" });
            
            // 4. Send signed txn to API
            // Convert Uint8Array to base64 string safely in browser
            const base64SignedTxn = btoa(
                Array.from(signedTxn)
                    .map(byte => String.fromCharCode(byte))
                    .join("")
            );

            const sendResult = await fetch('/api/assets/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signedTxn: base64SignedTxn })
            });
            const { txid, error: sendError } = await sendResult.json();
            if (sendError) throw new Error(sendError);

            toast.success("Opt-in Confirmed! Asset Syncing...", { id: "claim", duration: 8000 });
            setClaimAssetId('');
            setTimeout(loadAssets, 3000);
        } catch (error: any) {
            console.error("Claim Error:", error);
            toast.error("Opt-in Failed: " + error.message, { id: "claim" });
        } finally {
            setIsClaiming(false);
        }
    };

    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // RBAC Check
    const user = session?.user as any;

    if (!isHydrated || status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-gold" size={48} />
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Vault Intelligence...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        console.warn("[DASHBOARD] Access Denied - No Session Found. Redirecting to Login.");
        router.push("/login");
        return null;
    }

    if (user?.role !== "STUDENT") {
        console.error("[DASHBOARD] Role Mismatch. Found:", user?.role);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
                <div className="glass p-12 rounded-[3.5rem] border-red-500/20 max-w-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
                    <ShieldCheck size={64} className="text-red-500 mb-8 mx-auto opacity-50" />
                    <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">Access <span className="text-red-500 underline decoration-red-500/30">Denied</span></h1>
                    
                    <div className="bg-white/5 py-4 px-6 rounded-2xl mb-10 border border-white/5 inline-flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-mono uppercase tracking-widest">Identity Trace: <span className="text-white font-bold">{user?.role || "GUEST"}</span></p>
                    </div>

                    <p className="text-gray-400 mb-12 leading-relaxed font-medium text-sm">
                        This decentralized node requires a verified <span className="text-white font-bold tracking-widest uppercase text-[10px] bg-white/5 px-2 py-1 rounded">Student_Credential</span>. Your current identity layer is authorized for external portal access only.
                    </p>

                    <button 
                        onClick={() => {
                            window.location.href = "/login";
                        }} 
                        className="w-full bg-gold hover:bg-gold-dark text-black font-black px-10 py-5 rounded-[2rem] transition-all shadow-gold-glow uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                    >
                        <RefreshCw size={18} /> Switch to Student Wallet
                    </button>
                </div>
            </div>
        );
    }

    const isAddressMismatch = user?.address && accountAddress && user.address !== accountAddress;

    return (
        <main className="min-h-screen bg-background p-4 md:p-8 lg:p-12 relative overflow-hidden pt-40 md:pt-48">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full -z-10" />

            <div className="max-w-7xl mx-auto mt-10">
                <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.2em] shadow-gold-glow">
                            <ShieldCheck size={12} /> Secure Student Vault
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                            Academic <span className="gold-text-gradient italic">Sovereignty</span>.
                        </h1>
                        <p className="text-gray-400 text-lg font-medium max-w-xl">
                            Verified. Immutable. Secure. Manage your academic identity on the Algorand blockchain.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4"
                    >
                        <button 
                            onClick={loadAssets}
                            disabled={isLoading}
                            className="p-4 glass rounded-2xl text-gold hover:bg-gold/10 transition-all active:scale-95 group"
                        >
                            <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                    </motion.div>
                </header>

                <AnimatePresence mode="wait">
                    {/* Wallet Sync Status / Mismatch Warning */}
                    {isAddressMismatch && (
                        <motion.div 
                            key="mismatch"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-3xl backdrop-blur-xl overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-center sm:text-left">
                                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 flex-shrink-0">
                                        <X size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg tracking-tight uppercase">Security Mismatch</h4>
                                        <p className="text-red-400/80 text-sm font-medium">
                                            Current: <span className="font-mono text-white underline">{accountAddress.slice(0, 6)}...{accountAddress.slice(-6)}</span>. 
                                            Expected: <span className="font-mono text-white underline">{user.address.slice(0, 6)}...{user.address.slice(-6)}</span>.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={connect}
                                    className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    Switch Vault
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Main Content Area */}
                    {!accountAddress ? (
                        <motion.div 
                            key="no-wallet"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="flex flex-col items-center justify-center py-32 glass border-dashed border-gold/20 rounded-[3.5rem] text-center"
                        >
                            <div className="p-8 bg-gold/5 rounded-full mb-8 relative">
                                <Search size={64} className="text-gold/20" />
                                <div className="absolute inset-0 border border-gold/20 rounded-full animate-ping" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Vault Inaccessible</h2>
                            <p className="text-gray-500 max-w-sm mb-12">Please connect your authorized Algorand wallet (Testnet) to synthesize your academic credentials.</p>
                            <button 
                                onClick={connect}
                                className="bg-gold hover:bg-gold-dark text-black font-black px-12 py-5 rounded-2xl transition-all shadow-gold-glow uppercase tracking-widest text-sm flex items-center gap-3 active:scale-95"
                            >
                                <Wallet size={20} /> Connect Vault
                            </button>
                        </motion.div>
                    ) : isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32"
                        >
                            <div className="relative">
                                <RefreshCw className="animate-spin text-gold" size={64} />
                                <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
                            </div>
                            <p className="text-gold mt-8 font-black text-sm tracking-[0.5em] animate-pulse">SYNCHRONIZING LEDGER...</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="assets"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-12"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {assets.length > 0 ? (
                                    assets.map((asset, idx) => (
                                        <motion.div
                                            key={asset.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <CertificateCard 
                                                asset={asset as any} 
                                                onGenerateProof={() => handleOpenProofModal(asset)} 
                                                onShareBadge={() => handleOpenShareBadge(asset)}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-24 text-center glass rounded-[2.5rem] border-dashed border-white/5">
                                        <p className="text-gray-500 font-medium italic tracking-tight">No VeriDegree SBTs discovered in this node.</p>
                                    </div>
                                )}
                            </div>

                            {/* BlindHire AI Section */}
                            <div className="pt-12 border-t border-white/5">
                                <BlindHireCard />
                                <div className="mt-6 flex items-start gap-3 px-6 py-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 max-w-2xl">
                                    <Info size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                                    <p className="text-xs text-blue-400/80 font-medium leading-relaxed">
                                        <strong>Privacy First:</strong> Your ZK-Proof mathematically verifies your eligibility. Our BlindHire AI ensures recruiters only judge you on your skills, not your background. No PII is ever sent to the blockchain or stored on our servers.
                                    </p>
                                </div>
                            </div>

                            {/* Assessment & Claim Sections */}
                            <div className="pt-12 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Skill Assessment Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="glass p-10 rounded-[3.5rem] border-white/5 shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <GraduationCap size={160} className="text-gold" />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold ring-1 ring-gold/30">
                                            <GraduationCap size={32} />
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tight italic">Skill <span className="gold-text-gradient">Assessment</span></h3>
                                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                            Verify your expertise through AI-proctored exams and earn on-chain skill badges to showcase your competence.
                                        </p>
                                    </div>

                                    <div className="relative z-10 pt-10">
                                        <Link 
                                            href="/assess"
                                            className="w-full bg-gold hover:bg-gold-dark text-black font-black px-10 py-5 rounded-2xl transition-all shadow-gold-glow active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                                        >
                                            Take Assessment <CheckCircle size={18} />
                                        </Link>
                                    </div>
                                </motion.div>

                                {/* Claim New Degree Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="glass p-10 rounded-[3.5rem] border-white/5 shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <PlusCircle size={160} className="text-gold" />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold ring-1 ring-gold/30">
                                            <PlusCircle size={32} />
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tight italic">Claim <span className="gold-text-gradient">Asset</span></h3>
                                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                            Received a new degree? Enter the Asset ID to opt-in and mirror it to your decentralized student vault.
                                        </p>
                                    </div>

                                    <div className="relative z-10 space-y-4 pt-10">
                                        <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <Code className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40" size={18} />
                                                <input 
                                                    type="text"
                                                    value={claimAssetId}
                                                    onChange={(e) => setClaimAssetId(e.target.value)}
                                                    placeholder="Asset ID"
                                                    className="w-full bg-black/40 border border-white/10 p-5 pl-14 rounded-2xl focus:border-gold/40 outline-none transition-all text-white font-mono placeholder:text-gray-700 placeholder:font-sans"
                                                />
                                            </div>
                                            <button 
                                                type="submit"
                                                disabled={isClaiming || !claimAssetId}
                                                className="bg-white hover:bg-gold text-black font-black px-8 py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                            >
                                                {isClaiming ? <Loader2 className="animate-spin" size={18} /> : "Synthesize"}
                                            </button>
                                        </form>
                                        <p className="text-[10px] text-gray-500 ml-2">
                                            Need Testnet ALGO? <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline font-bold">Get it from Faucet →</a>
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Setup Modal */}
                <AnimatePresence>
                    {showProfileSetup && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass border-gold/30 w-full max-w-lg rounded-[3.5rem] p-12 text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gold/30" />
                                
                                <div className="w-20 h-20 bg-gold/10 rounded-3xl flex items-center justify-center text-gold mx-auto mb-8 border border-gold/20 shadow-gold-glow">
                                    <Briefcase size={40} />
                                </div>

                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">
                                    Identity <span className="gold-text-gradient">Bridge</span>.
                                </h2>
                                <p className="text-gray-400 mb-10 text-xs font-medium uppercase tracking-widest">
                                    Complete your professional metadata to enable recruiter discovery.
                                </p>

                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div className="relative">
                                        <PlusCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40" size={18} />
                                        <input 
                                            type="text" required
                                            value={profileData.name}
                                            onChange={e => setProfileData({...profileData, name: e.target.value})}
                                            placeholder="Professional Full Name"
                                            className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl focus:border-gold/40 outline-none transition-all text-white"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40" size={18} />
                                        <input 
                                            type="email" required
                                            value={profileData.email}
                                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                                            placeholder="Professional Email (for recruiters)"
                                            className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl focus:border-gold/40 outline-none transition-all text-white"
                                        />
                                    </div>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40" size={18} />
                                        <input 
                                            type="tel" required
                                            value={profileData.phone}
                                            onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                            placeholder="Contact Number"
                                            className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl focus:border-gold/40 outline-none transition-all text-white"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="w-full bg-gold hover:bg-gold-dark text-black font-black py-5 rounded-2xl transition-all shadow-gold-glow uppercase tracking-widest text-xs flex items-center justify-center gap-3 mt-4"
                                    >
                                        {isSavingProfile ? <Loader2 className="animate-spin" /> : "Synthesize Profile Identity"}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <ZKProofModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    asset={selectedAsset} 
                />

                {/* Share Badge Modal */}
                <AnimatePresence>
                    {isShareModalOpen && sharingAsset && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="glass border-gold/30 w-full max-w-2xl rounded-[3rem] p-10 relative shadow-gold-glow max-h-[90vh] overflow-y-auto"
                            >
                                <button 
                                    onClick={() => setIsShareModalOpen(false)} 
                                    className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center mb-10">
                                    <div className="w-20 h-20 bg-gold/10 rounded-[2rem] flex items-center justify-center text-gold mb-6 ring-1 ring-gold/30 shadow-gold-glow">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Share <span className="gold-text-gradient">VeriBadge</span></h2>
                                    <p className="text-gray-400 mt-2 text-center text-sm font-medium max-w-sm">
                                        Project your verification status across the global digital landscape.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        {/* HTML Snippet */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Code size={14} /> Web Integration
                                            </label>
                                            <div className="relative group">
                                                <pre className="bg-black/50 border border-white/10 p-5 rounded-2xl text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                    {`<iframe src="${window.location.origin}/embed/${sharingAsset.id}" width="300" height="150" frameborder="0"></iframe>`}
                                                </pre>
                                                <button 
                                                    onClick={() => copyToClipboard(`<iframe src="${window.location.origin}/embed/${sharingAsset.id}" width="300" height="150" frameborder="0"></iframe>`, 'HTML')}
                                                    className="absolute top-3 right-3 bg-gold/20 hover:bg-gold text-gold hover:text-black p-2.5 rounded-xl transition-all shadow-gold-glow"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Markdown Snippet */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Github size={14} /> Ecosystem Ready (MD)
                                            </label>
                                            <div className="relative group">
                                                <pre className="bg-black/50 border border-white/10 p-5 rounded-2xl text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                    {`[![VeriDegree](${window.location.origin}/embed/${sharingAsset.id})](${window.location.origin}/verify?asset=${sharingAsset.id})`}
                                                </pre>
                                                <button 
                                                    onClick={() => copyToClipboard(`[![VeriDegree](${window.location.origin}/embed/${sharingAsset.id})](${window.location.origin}/verify?asset=${sharingAsset.id})`, 'Markdown')}
                                                    className="absolute top-3 right-3 bg-gold/20 hover:bg-gold text-gold hover:text-black p-2.5 rounded-xl transition-all shadow-gold-glow"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code Section */}
                                    <div className="glass border-gold/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-gold-glow">
                                        <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                            <QrCode size={14} /> Paper-to-Chain
                                        </label>
                                        
                                        <div className="bg-white p-4 rounded-[2rem] mb-6 shadow-2xl">
                                            <QRCodeSVG 
                                                id="qr-code-svg"
                                                value={`${window.location.origin}/verify?assetId=${sharingAsset.id}`} 
                                                size={150}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>

                                        <p className="text-[10px] text-gray-500 mb-8 font-medium leading-relaxed uppercase tracking-tighter">
                                            Instant physical-to-digital bridge for resume verification.
                                        </p>

                                        <button 
                                            onClick={downloadQRCode}
                                            className="w-full bg-white hover:bg-gold hover:text-black text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            <Download size={18} />
                                            Export QR
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
                                    <p className="text-[10px] text-gray-500 font-mono tracking-[0.4em] text-center uppercase">
                                        In Cryptography We Trust
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
