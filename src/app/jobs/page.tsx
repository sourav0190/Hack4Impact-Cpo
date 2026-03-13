"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useWallet } from '@/lib/WalletContext';
import { 
    Briefcase, 
    ShieldCheck, 
    ArrowRight, 
    Loader2,
    Search,
    Filter,
    Gem,
    TrendingUp,
    Zap,
    MapPin,
    DollarSign,
    CheckCircle,
    XCircle,
    Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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

interface Asset {
    id: string;
    amount: number;
    name?: string;
}

export default function JobPortal() {
    const { data: session } = useSession();
    const { accountAddress } = useWallet() as any;
    const [jobs, setJobs] = useState<Job[]>([]);
    const [userAssets, setUserAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [accountAddress]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [jobsRes, assetsRes] = await Promise.all([
                fetch('/api/jobs'),
                accountAddress ? fetch(`/api/assets?address=${accountAddress}`) : Promise.resolve({ json: () => ({ assets: [] }) })
            ]);
            
            const jobsData = await jobsRes.json();
            const { assets } = await (assetsRes as any).json();
            
            setJobs(jobsData);
            setUserAssets(assets || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to sync marketplace data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = async (job: Job) => {
        if (!accountAddress) return toast.error("Connect wallet to apply");
        
        setIsApplying(job.id);
        try {
            const res = await fetch('/api/jobs/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job.id,
                    studentAddress: accountAddress,
                    name: session?.user?.name
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Application failed");
            
            toast.success(`Application Sent! Skill Match: ${data.skillMatchScore}%`, { duration: 5000 });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsApplying(null);
        }
    };

    const checkSkills = (jobSkills: string[]) => {
        const ownedNames = userAssets.map(a => (a.name || "").toLowerCase());
        const matched = jobSkills.filter(s => 
            ownedNames.some(own => own.includes(s.toLowerCase()))
        );
        return {
            isQualified: matched.length > 0,
            allMatched: matched.length === jobSkills.length,
            matchedCount: matched.length,
            totalCount: jobSkills.length
        };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="animate-spin text-gold mb-4" size={48} />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse text-center">Scanning Jobs & On-Chain Credentials...</p>
            </div>
        );
    }

    const filteredJobs = jobs.filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-background p-4 md:p-8 lg:p-12 pt-40 md:pt-48 overflow-hidden relative">
             {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/5 blur-[100px] rounded-full -z-10" />

            <div className="max-w-7xl mx-auto mt-10">
                <header className="mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.2em] shadow-gold-glow">
                                <Zap size={12} className="fill-gold" /> Web3 Talent Marketplace
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                                Verified <span className="gold-text-gradient italic">Careers</span>.
                            </h1>
                            <p className="text-gray-400 text-lg font-medium max-w-xl">
                                Your ZK-Verified skills are your ticket to the future. Apply with cryptographic certainty.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-[2rem] w-full md:w-96 shadow-inner">
                            <Search className="text-gray-500 ml-4" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by title, company, or stack..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-white text-sm w-full py-3 px-2 placeholder:text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Active Jobs", val: jobs.length, icon: Briefcase },
                            { label: "My Applications", val: "0", icon: CheckCircle },
                            { label: "Verified Badges", val: userAssets.length, icon: Award },
                            { label: "Trust Score", val: "98%", icon: ShieldCheck },
                        ].map((stat, i) => (
                            <div key={i} className="glass border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gold">
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-black text-white">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredJobs.map((job, idx) => {
                        const { isQualified, allMatched, matchedCount, totalCount } = checkSkills(job.requiredSkills);
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={job.id}
                                className="glass border-white/5 p-8 rounded-[3rem] group hover:border-gold/30 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-gold transition-colors">{job.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <TrendingUp size={14} className="text-gold" />
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{job.company}</span>
                                            </div>
                                        </div>
                                        <div className="bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-full text-[10px] font-black text-gold uppercase tracking-widest">
                                            {job.salary}
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                        {job.description}
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <ShieldCheck size={12} className="text-gold" /> Required Skill Verification
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {job.requiredSkills.map(s => {
                                                const hasIt = userAssets.some(a => (a.name || "").toLowerCase().includes(s.toLowerCase()));
                                                return (
                                                    <span key={s} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${hasIt ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                                                        {hasIt ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                        {s}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Match Quality</span>
                                        <div className="flex gap-1">
                                            {[...Array(totalCount)].map((_, i) => (
                                                <div key={i} className={`h-1 w-6 rounded-full ${i < matchedCount ? 'bg-gold shadow-gold-glow' : 'bg-white/5'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    {isQualified ? (
                                        <button 
                                            onClick={() => handleApply(job)}
                                            disabled={isApplying === job.id}
                                            className="bg-gold hover:bg-gold-dark text-black font-black px-10 py-4 rounded-2xl transition-all shadow-gold-glow uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 group-hover:-translate-y-1"
                                        >
                                            {isApplying === job.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                            Apply Securely
                                        </button>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                                            <ShieldCheck size={14} /> Skills Required to Unlock
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {filteredJobs.length === 0 && (
                        <div className="col-span-1 lg:col-span-2 text-center py-32 glass rounded-[3rem] border-white/5 border-dashed">
                            <Briefcase size={64} className="text-gray-800 mx-auto mb-6 opacity-20 outline-dashed outline-1 outline-offset-8 rounded-full" />
                            <h3 className="text-xl font-black text-gray-600 uppercase tracking-tighter">No Opportunities Found</h3>
                            <p className="text-sm text-gray-700 font-medium">Try broadening your search or acquiring more Skill Badges in the Assess portal.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
