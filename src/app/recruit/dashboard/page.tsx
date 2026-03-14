"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/WalletContext';
import { 
    Briefcase, 
    Plus, 
    Users, 
    ShieldCheck, 
    ArrowUpRight, 
    Clock, 
    Search,
    CheckCircle,
    Wallet,
    ArrowRight,
    Mail,
    Phone,
    Loader2,
    X,
    Filter,
    Gem,
    TrendingUp,
    Zap,
    MapPin,
    DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import algosdk from 'algosdk';
import { algodClient } from '@/lib/algorand';

const UNIVERSITY_TREASURY = "Y6L3YTWYFQ3OS7VJMFWCYPR7H6BKVD33YGBP6OMRL2KQ5LA7IBSSXJDW7Y"; // University Treasury

interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    salary: string;
    requiredSkills: string[];
    postedBy: string;
    createdAt: string;
}

interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    studentAddress: string;
    studentName: string;
    skillMatchScore: number;
    matchedSkills: string[];
    status: string;
    appliedAt: string;
    isUnlocked?: boolean;
    studentEmail?: string;
    studentPhone?: string;
}

export default function EmployerDashboard() {
    const { data: session, status } = useSession();
    const { accountAddress, connect, deflyWallet } = useWallet() as any;
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && (session.user as any).role !== "EMPLOYER") {
            router.push("/dashboard");
        } else if (session) {
            fetchData();
        }
    }, [session, status]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                fetch('/api/jobs'),
                fetch('/api/jobs/apply')
            ]);
            
            const jobsData = await jobsRes.json();
            const appsData = await appsRes.json();
            
            // Filter jobs posted by this employer
            const myJobs = jobsData.filter((j: Job) => j.postedBy === session?.user?.email);
            setJobs(myJobs);
            setApplications(appsData);
        } catch (error) {
            toast.error("Failed to sync recruitment data");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newJob,
                    requiredSkills: newJob.skills.split(',').map(s => s.trim())
                })
            });
            
            if (!res.ok) throw new Error("Failed to post job");
            
            toast.success("Job Published to Network");
            setIsPostModalOpen(false);
            setNewJob({ title: '', company: '', description: '', salary: '', skills: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleUnlock = async (appId: string, maskedAddress: string) => {
        if (!accountAddress) return;
        setIsLoading(true);
        try {
            toast.loading("Securing Candidate Gateway...", { id: "unlock" });
            
            // 0. Fetch real address from Secure Gateway
            const addrRes = await fetch(`/api/recruit/unlock?applicationId=${appId}`);
            const { studentAddress, error: addrError } = await addrRes.json();
            if (addrError) throw new Error(addrError);

            toast.loading("Initiating Web3 Payment Flow...", { id: "unlock" });
            
            const params = await algodClient.getTransactionParams().do();
            
            // 1. Payment to Student (0.7 ALGO)
            const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: accountAddress,
                receiver: studentAddress,
                amount: 700000, // 0.7 ALGO
                suggestedParams: params
            });

            // 2. Payment to University (0.3 ALGO)
            const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: accountAddress,
                receiver: UNIVERSITY_TREASURY,
                amount: 300000, // 0.3 ALGO
                suggestedParams: params
            });

            // Group transactions
            const txns = [txn1, txn2];
            algosdk.assignGroupID(txns);

            toast.loading("Awaiting Wallet Signature...", { id: "unlock" });
            
            // Sign using Defly/Pera
            const txnGroup = txns.map(txn => ({ txn, signers: [accountAddress] }));
            const signedResult = await deflyWallet.signTransaction([txnGroup]);
            
            toast.loading("Broadcasting to Algorand...", { id: "unlock" });
            
            const { txid } = await algodClient.sendRawTransaction(signedResult).do();
            
            // Confirm on-chain
            await algosdk.waitForConfirmation(algodClient, txid, 4);

            const res = await fetch('/api/recruit/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: appId, txID: txid })
            });
            
            if (!res.ok) throw new Error("Backend verification failed");
            
            toast.success("Identity Unlocked Successfully!", { id: "unlock" });
            fetchData();
        } catch (err: any) {
            console.error("Unlock Error:", err);
            toast.error(err.message || "Unlock Failed", { id: "unlock" });
        } finally {
            setIsLoading(false);
        }
    };

    // New Job Form
    const [newJob, setNewJob] = useState({
        title: '',
        company: '',
        description: '',
        salary: '',
        skills: ''
    });

    if (!isHydrated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-gold" size={48} />
            </div>
        );
    }

    // --- WALLET GUARD ---
    const sessionAddress = (session?.user as any)?.address;
    
    // If session has an address (logged via wallet), it MUST match accountAddress.
    // If session has NO address (logged via email), we just need ANY accountAddress.
    const isWalletCorrect = sessionAddress 
        ? (accountAddress && accountAddress === sessionAddress)
        : !!accountAddress;

    if (!isWalletCorrect) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 pt-24">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass border-gold/20 p-12 rounded-[3.5rem] max-w-xl w-full text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -z-10" />
                    
                    <div className="w-20 h-20 bg-gold/10 rounded-3xl flex items-center justify-center text-gold mx-auto mb-8 border border-gold/20 shadow-gold-glow">
                        <Wallet size={40} />
                    </div>

                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">
                        Command <span className="gold-text-gradient">Lock</span>.
                    </h1>
                    <p className="text-gray-400 mb-10 font-medium leading-relaxed">
                        To access the Recruitment Command Center, your verified employer wallet must be connected. This ensures all hire actions are cryptographically signed.
                    </p>

                    <div className="space-y-4">
                        <button 
                            onClick={() => connect()}
                            className="w-full bg-gold hover:bg-gold-dark text-black font-black py-5 rounded-2xl transition-all shadow-gold-glow uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Gem size={18} /> Connect Verified Wallet
                        </button>
                        
                        <div className="flex items-center gap-4 py-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] justify-center">
                            <span className="h-px w-8 bg-white/5" /> Secure Trust Protocol v2 <span className="h-px w-8 bg-white/5" />
                        </div>

                        <p className="text-[10px] font-mono text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5">
                            Required Address: {sessionAddress ? `${sessionAddress.slice(0, 10)}...${sessionAddress.slice(-10)}` : "None Found"}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    const filteredApps = selectedJobId 
        ? applications.filter(a => a.jobId === selectedJobId)
        : applications;

    return (
        <main className="min-h-screen bg-[#0a0a0a] p-4 md:p-8 lg:p-12 pt-40 md:pt-48">
            <div className="max-w-7xl mx-auto mt-10">
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center border border-gold/20 shadow-gold-glow">
                                <Gem size={16} className="text-gold" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Command Center v1.0</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
                            Elite <span className="gold-text-gradient underline decoration-gold/20">Talent</span><br className="hidden md:block" /> Acquisition.
                        </h1>
                        <p className="text-gray-500 text-xs md:text-sm font-medium max-w-xl leading-relaxed">
                            Access ZK-verified credentials and execute on-chain recruitment with institutional-grade security mechanisms.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setIsPostModalOpen(true)}
                        className="w-full md:w-auto bg-gold hover:bg-gold-dark text-black font-black px-10 py-5 rounded-2xl transition-all shadow-gold-glow uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> 
                        Post New Requirement
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Jobs List */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                             <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Briefcase size={14} className="text-gold" /> Active Postings
                            </h2>
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gold">
                                {jobs.length} Active
                            </span>
                        </div>
                        
                        {jobs.map(job => (
                            <motion.div 
                                key={job.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group ${job.id === selectedJobId ? 'bg-gold/10 border-gold shadow-gold-glow' : 'glass border-white/5 hover:border-gold/30'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className={`font-black uppercase tracking-tight ${job.id === selectedJobId ? 'text-gold' : 'text-white'}`}>{job.title}</h3>
                                    <div className="p-2 bg-white/5 rounded-xl group-hover:bg-gold transition-colors">
                                        <ArrowUpRight size={14} className={job.id === selectedJobId ? 'text-gold' : 'text-gray-500 group-hover:text-black'} />
                                    </div>
                                </div>
                                <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                                    <span className="flex items-center gap-1"><MapPin size={10} /> Remote</span>
                                    <span className="flex items-center gap-1 text-gold"><DollarSign size={10} /> {job.salary}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {job.requiredSkills.map(s => (
                                        <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {jobs.length === 0 && (
                            <div className="glass p-12 rounded-[3rem] border-dashed border-white/10 text-center">
                                <Briefcase size={40} className="text-gray-600 mx-auto mb-4 opacity-20" />
                                <p className="text-gray-500 text-sm font-medium">No active listings. Start by posting your first job requirement.</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Applicants Ranking */}
                    <div className="lg:col-span-7">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                             <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Users size={14} className="text-gold" /> 
                                {selectedJobId ? "Verified Applicants" : "Global Talent Pool"}
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="p-1 px-4 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-500 flex items-center gap-2 uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    ZK-Verified
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredApps.map((app, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={app.id}
                                    className="glass p-6 rounded-[2.5rem] border-white/5 hover:border-gold/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-2xl border border-white/10 shadow-inner group-hover:border-gold/30 transition-all">
                                            {app.isUnlocked ? app.studentName[0] : "?"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-white font-black uppercase tracking-tight truncate">
                                                {app.isUnlocked ? app.studentName : `Candidate ${app.studentAddress.slice(-4)}`}
                                            </h4>
                                            <p className="text-[10px] font-mono text-gray-500 truncate">
                                                {app.isUnlocked ? app.studentAddress : "Address Locked • Pay to Reveal"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-24 md:w-32 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${app.skillMatchScore}%` }}
                                                    className={`h-full ${app.skillMatchScore > 70 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gold shadow-gold-glow'}`}
                                                />
                                            </div>
                                            <span className="text-xl font-black italic text-white leading-none">{app.skillMatchScore}%</span>
                                        </div>
                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">Skill Alignment Score</span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 w-full md:w-auto">
                                        {app.isUnlocked ? (
                                            <div className="flex flex-col gap-1 items-start sm:items-end md:items-start lg:items-end min-w-0 w-full lg:w-48 xl:w-64">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)] w-full overflow-hidden">
                                                    <Mail size={12} className="flex-shrink-0" /> 
                                                    <span className="truncate">{app.studentEmail}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)] w-full">
                                                    <Phone size={12} className="flex-shrink-0" /> 
                                                    <span className="truncate">{app.studentPhone}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleUnlock(app.id, app.studentAddress)}
                                                className="w-full sm:w-auto bg-gold hover:bg-gold-dark text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-gold-glow active:scale-95"
                                            >
                                                <Zap size={14} className="fill-current" /> Unlock Identity (1 ALGO)
                                            </button>
                                        )}
                                        <button className="w-full sm:w-auto bg-white/5 hover:bg-white text-white hover:text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 hover:border-transparent">
                                            Deep Insights
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredApps.length === 0 && (
                                <div className="text-center py-24 glass rounded-[3rem] border-white/5">
                                    <Users size={48} className="text-gray-700 mx-auto mb-4 opacity-30" />
                                    <p className="text-gray-500 font-medium">No applicants found for the selected criteria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Job Modal */}
            <AnimatePresence>
                {isPostModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass border-gold/30 w-full max-w-2xl rounded-[3rem] p-10 relative"
                        >
                            <button onClick={() => setIsPostModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 italic">Publish <span className="gold-text-gradient">Opportunity</span></h2>
                            
                            <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-4">Position Title</label>
                                    <input 
                                        type="text" required
                                        value={newJob.title}
                                        onChange={e => setNewJob({...newJob, title: e.target.value})}
                                        placeholder="Senior Blockchain Architect"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-700 outline-none focus:border-gold/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-4">Company Name</label>
                                    <input 
                                        type="text" required
                                        value={newJob.company}
                                        onChange={e => setNewJob({...newJob, company: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-4">Salary Range</label>
                                    <input 
                                        type="text"
                                        value={newJob.salary}
                                        onChange={e => setNewJob({...newJob, salary: e.target.value})}
                                        placeholder="120k - 180k ALGO"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-4">Required Skill Badges (Comma Separated)</label>
                                    <input 
                                        type="text" required
                                        value={newJob.skills}
                                        onChange={e => setNewJob({...newJob, skills: e.target.value})}
                                        placeholder="React, Algorand, Python, Security"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-4">Job Description</label>
                                    <textarea 
                                        required
                                        value={newJob.description}
                                        onChange={e => setNewJob({...newJob, description: e.target.value})}
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all resize-none"
                                    />
                                </div>
                                
                                <button className="md:col-span-2 bg-gold hover:bg-gold-dark text-black font-black py-5 rounded-2xl transition-all shadow-gold-glow uppercase tracking-widest text-sm mt-4 active:scale-95">
                                    Broadcast to Verified Talent Pool
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
