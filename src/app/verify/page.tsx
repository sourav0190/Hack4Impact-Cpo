"use client";
import React, { useState } from 'react';
import { fetchAssetDetails, indexerClient } from '@/lib/algorand';
import { Search, ShieldCheck, BadgeCheck, FileUp, Loader2, XCircle, Camera, X, Check, ArrowRight, Zap, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyNativeDisclosure } from '@/lib/nativeVerify';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import UnlockBountyCard from '@/components/UnlockBountyCard';

interface AssetData {
    id: string;
    holder: string;
    name?: string;
    creator?: string;
    [key: string]: any;
}

interface ZkResult {
    success: boolean;
    message: string;
}

export default function VerifyPage() {
    const [assetId, setAssetId] = useState<string>('');
    const [assetData, setAssetData] = useState<AssetData | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [zkFile, setZkFile] = useState<File | null>(null);
    const [isVerifyingZk, setIsVerifyingZk] = useState<boolean>(false);
    const [zkResult, setZkResult] = useState<ZkResult | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
    const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

    const handleSearch = async (passedId?: string) => {
        const idToSearch = passedId || assetId;
        if (!idToSearch) return;
        
        setIsSearching(true);
        setAssetData(null);
        setZkResult(null);
        try {
            const details = await fetchAssetDetails(Number(idToSearch));
            if (!details || !details.params) throw new Error("Asset not found");
            
            const holders = await indexerClient.lookupAssetBalances(Number(idToSearch)).do();
            const holder = holders.balances.find((b: any) => BigInt(b.amount) > 0n);

            setAssetData({
                ...details.params,
                id: idToSearch,
                holder: holder ? holder.address : 'Burned/None'
            });
            toast.success("Asset details fetched!");
        } catch (error: any) {
            toast.error(error?.message || "Error fetching asset details");
        } finally {
            setIsSearching(false);
        }
    };

    const startScanner = async () => {
        setIsScannerOpen(true);
        // Delay to ensure the container is rendered
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                setScannerInstance(html5QrCode);
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText: string) => {
                        console.log("QR Decoded:", decodedText);
                        try {
                            const url = new URL(decodedText);
                            const id = url.searchParams.get("assetId");
                            if (id) {
                                setAssetId(id);
                                stopScanner(html5QrCode);
                                handleSearch(id);
                                toast.success("QR Scanned Successfully!");
                            } else {
                                toast.error("Invalid VeriDegree QR Code");
                            }
                        } catch (e) {
                            toast.error("Invalid QR Code");
                        }
                    },
                    (_errorMessage: string) => {
                        // Suppress scanning errors to avoid noise
                    }
                );
            } catch (err) {
                console.error("Scanner Error:", err);
                toast.error("Could not start camera. Check permissions.");
                setIsScannerOpen(false);
            }
        }, 100);
    };

    const stopScanner = async (instance: Html5Qrcode | null = scannerInstance) => {
        if (instance && instance.isScanning) {
            await instance.stop();
        }
        setIsScannerOpen(false);
        setScannerInstance(null);
    };

    const handleVerifyZK = async () => {
        if (!zkFile) return toast.error("Please upload a proof file");
        
        setIsVerifyingZk(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e: ProgressEvent<FileReader>) => {
                try {
                    const result = e.target?.result;
                    if (typeof result !== 'string') throw new Error("Invalid file content");
                    
                    const proofObj = JSON.parse(result);
                    
                    toast.loading("Verifying Native Proof...", { id: "zk-v" });
                    
                    const isValid = await verifyNativeDisclosure(proofObj);
                    
                    if (isValid) {
                        setZkResult({ success: true, message: `Valid Proof: CGPA is ≥ ${proofObj.threshold || '8.0'}` });
                        toast.success("Native Proof Verified!", { id: "zk-v" });
                    } else {
                        setZkResult({ success: false, message: "Invalid Proof or criteria not met" });
                        toast.error("Proof Verification Failed", { id: "zk-v" });
                    }
                } catch (err: any) {
                    toast.error("Invalid proof file format", { id: "zk-v" });
                } finally {
                    setIsVerifyingZk(false);
                }
            };
            reader.readAsText(zkFile);
        } catch (error) {
            toast.error("Error reading file");
            setIsVerifyingZk(false);
        }
    };

    return (
        <main className="min-h-screen bg-background p-4 lg:p-12 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full -z-10" />

            <div className="max-w-5xl mx-auto pt-20">
                <header className="text-center mb-20 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 glass border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-gold-glow"
                    >
                        <Zap size={12} className="fill-gold" /> Algorand Mainnet Node-04 Verified
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.8]"
                    >
                        Public <span className="gold-text-gradient italic">Verifier</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg font-medium max-w-2xl mx-auto"
                    >
                        De-siloing academic records through cryptographic selective disclosure and immutable blockchain state.
                    </motion.p>
                </header>

                <div className="space-y-12">
                    {/* Search Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass p-2 rounded-[2.5rem] border-white/5 shadow-2xl"
                    >
                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col md:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold/40" size={20} />
                                <input 
                                    value={assetId}
                                    onChange={e => setAssetId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 p-6 pl-16 rounded-[2rem] focus:border-gold/30 outline-none transition-all text-white font-mono placeholder:text-gray-600 placeholder:font-sans"
                                    placeholder="Enter Digital Asset ID (SBT)"
                                />
                            </div>
                            <div className="flex gap-2 p-1">
                                <button 
                                    type="submit"
                                    disabled={isSearching}
                                    className="flex-1 bg-gold hover:bg-gold-dark text-black font-black px-10 py-5 rounded-[1.8rem] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-gold-glow uppercase tracking-widest text-sm"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" /> : <><Check size={20} strokeWidth={3} /> Verify</>}
                                </button>
                                <button 
                                    type="button"
                                    onClick={startScanner}
                                    className="bg-white/5 hover:bg-white/10 text-gold p-5 rounded-[1.8rem] border border-white/5 transition-all flex items-center justify-center active:scale-95 group"
                                    title="Scan Resume QR"
                                >
                                    <Camera size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {assetData && (
                            <motion.div 
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                            >
                                <div className="lg:col-span-7 glass p-10 rounded-[3rem] border-gold/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <BadgeCheck size={160} className="text-gold" />
                                    </div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 ring-1 ring-green-500/30">
                                                <BadgeCheck size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Authentic Attestation</h3>
                                                <div className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Algorand Virtual Machine Verified
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { label: "Asset Name", value: assetData.name || 'Unknown', mono: false },
                                                { label: "Issuing Entity", value: assetData.creator || 'Unknown', mono: true },
                                                { label: "Registered Holder", value: assetData.holder, mono: true },
                                                { label: "Network State", value: "FINALIZED", mono: false }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
                                                    <span className={`text-sm ${item.mono ? 'font-mono text-gold/70 text-[11px]' : 'font-bold text-white'}`}>
                                                        {item.mono && item.value.length > 20 ? `${item.value.slice(0, 12)}...${item.value.slice(-8)}` : item.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 glass p-10 rounded-[3rem] border-white/10 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-gold/10 rounded-xl">
                                                <GraduationCap size={24} className="text-gold" />
                                            </div>
                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">Native Disclosure</h4>
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
                                            Verify specific disclosure claims (e.g., CGPA thresholds) strictly via Algorand metadata.
                                        </p>
                                        
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <input 
                                                    type="file" 
                                                    id="zk-upload"
                                                    onChange={e => { if (e.target.files && e.target.files[0]) setZkFile(e.target.files[0]); }}
                                                    className="hidden"
                                                />
                                                <label 
                                                    htmlFor="zk-upload"
                                                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-3xl hover:border-gold/50 hover:bg-gold/5 transition-all cursor-pointer group-hover:shadow-gold-glow"
                                                >
                                                    <FileUp size={32} className="text-gray-500 group-hover:text-gold mb-3 transition-colors" />
                                                    <span className="text-xs font-bold text-gray-400 group-hover:text-white">
                                                        {zkFile ? zkFile.name : "Upload .proof File"}
                                                    </span>
                                                </label>
                                            </div>

                                            <button 
                                                onClick={handleVerifyZK}
                                                disabled={!zkFile || isVerifyingZk}
                                                className="w-full bg-white text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 hover:bg-gold uppercase tracking-widest text-xs"
                                            >
                                                {isVerifyingZk ? <Loader2 className="animate-spin" size={18} /> : <>Generate Disclosure <ArrowRight size={16} /></>}
                                            </button>

                                            <AnimatePresence>
                                                {zkResult && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className={`p-4 rounded-2xl text-center font-bold text-xs uppercase tracking-widest border ${zkResult.success ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-glow' : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-glow'}`}
                                                    >
                                                        <div className="flex items-center justify-center gap-2">
                                                            {zkResult.success ? <BadgeCheck size={18} /> : <XCircle size={18} />}
                                                            {zkResult.message}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            
                                            {/* Render Talent Bounty Card ONLY if Proof is successfully verified */}
                                            {zkResult?.success && assetData?.holder && assetData?.creator && (
                                                <UnlockBountyCard studentAddress={assetData.holder} universityAddress={assetData.creator} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <div className="flex items-center justify-center gap-4 grayscale opacity-30">
                                            <span className="text-[8px] font-black tracking-widest uppercase">Algorand Standard Asset</span>
                                            <span className="text-[8px] font-black tracking-widest uppercase">Stateless Assertion</span>
                                            <span className="text-[8px] font-black tracking-widest uppercase">On-Chain Resolution</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <footer className="mt-20 text-center space-y-4 opacity-40">
                    <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white">Trust but Verify • Decentralized Ledger Public Key Node-8</p>
                    <div className="h-0.5 w-12 bg-gold/30 mx-auto rounded-full" />
                </footer>

                {/* Scanner Modal */}
                <AnimatePresence>
                    {isScannerOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                className="glass border-gold/30 w-full max-w-lg rounded-[3rem] p-10 relative overflow-hidden shadow-gold-glow"
                            >
                                <button 
                                    onClick={() => stopScanner()} 
                                    className="absolute top-8 right-8 z-10 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center mb-10">
                                    <div className="w-20 h-20 bg-gold/10 rounded-[2.5rem] flex items-center justify-center text-gold mb-6 ring-1 ring-gold/40 shadow-gold-glow">
                                        <Camera size={36} />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">QR <span className="gold-text-gradient">Synthesis</span></h2>
                                    <p className="text-gray-400 mt-2 text-center text-sm font-medium">
                                        Align the VeriBadge QR code with the sensor grid below.
                                    </p>
                                </div>

                                <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] border-2 border-gold/20 bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)_inset]">
                                    <div id="reader" className="w-full h-full"></div>
                                    {/* Scanning UI Overlay */}
                                    <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-0.5 bg-gold shadow-gold-glow animate-[scan_2s_infinite_ease-in-out]"></div>
                                    <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none"></div>
                                    
                                    {/* Corner Accents */}
                                    <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-gold rounded-tl-xl shadow-gold-glow"></div>
                                    <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-gold rounded-tr-xl shadow-gold-glow"></div>
                                    <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-gold rounded-bl-xl shadow-gold-glow"></div>
                                    <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-gold rounded-br-xl shadow-gold-glow"></div>
                                </div>
                                
                                <p className="mt-10 text-center text-[9px] text-gold/50 font-black tracking-[0.5em] uppercase">
                                    Initializing Cryptographic Sensor Loop
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style jsx global>{`
                    @keyframes scan {
                        0%, 100% { top: 10%; }
                        50% { top: 90%; }
                    }
                    #reader__scan_region {
                        background: transparent !important;
                    }
                    #reader video {
                        object-fit: cover !important;
                        border-radius: 20px;
                    }
                `}</style>
            </div>
        </main>
    );
}
