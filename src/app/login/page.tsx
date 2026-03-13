"use client";
import React, { useState, FormEvent } from 'react';
import { GraduationCap, ShieldCheck, Mail, Lock, Wallet, ArrowRight, Loader2, Sparkles, Building2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useWallet } from '@/lib/WalletContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [authTab, setAuthTab] = useState<'university' | 'employer'>('university');
    const { accountAddress, connect } = useWallet() as any;
    const router = useRouter();

    const handleUniversityLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await signIn("university_credentials", {
                email,
                password,
                redirect: false
            });

            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Institution Authenticated!");
                router.push("/issue");
            }
        } catch (err) {
            toast.error("Internal Auth Error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmployerLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await signIn("employer_credentials", {
                email,
                password,
                redirect: false
            });

            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Employer Authenticated!");
                router.push("/recruit/dashboard");
            }
        } catch (err) {
            toast.error("Internal Auth Error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentLogin = async () => {
        let currentAddress = accountAddress;
        
        if (!currentAddress) {
            currentAddress = await connect();
            if (!currentAddress) return; // User cancelled or failed
        }

        setIsLoading(true);
        try {
            const nonce = `Sign this message to login to VeriDegree: ${Date.now()}`;
            const enc = new TextEncoder();
            const messageBytes = enc.encode(nonce);

            // Using the signer provider from WalletContext
            const txn = {
                msig: undefined,
                sig: undefined,
                lsig: undefined,
                txn: {
                    type: "pay",
                    from: currentAddress,
                    to: currentAddress,
                    amount: 0,
                    note: messageBytes,
                    genesisID: "testnet-v1.0",
                    genesisHash: "SGO1GKSzyE7IEPXYbbjOk6FA3LxAtN7Wq/IA6S57zhw=",
                    firstRound: 1,
                    lastRound: 1000,
                    fee: 1000,
                }
            };

            // In a real SIWA, we just need a signature of the message. 
            // For this implementation, we'll use a simple signature verification.
            // Note: WalletContext signer usually signs transactions. 
            // We'll simulate the cryptographic check for this demo.
            
            const result = await signIn("student-algorand", {
                address: currentAddress,
                signature: "demo_sig_verified_by_backend", // Placeholder for actual sig
                nonce: nonce,
                redirect: false
            });

            if (result?.error) {
                toast.error("Wallet Auth Failed");
            } else {
                toast.success("Wallet Authenticated!");
                router.push("/dashboard");
            }
        } catch (err) {
            console.error(err);
            toast.error("Signature Failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0a0a0a]">
            <section className="relative flex items-center justify-center p-8 pt-32 pb-20 lg:p-24 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#1a1a1a_0%,transparent_50%)]" />
                
                <div className="relative w-full max-w-md animate-in fade-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            {authTab === 'university' ? <GraduationCap className="text-white" size={28} /> : <Building2 className="text-white" size={28} />}
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight text-nowrap">
                            {authTab === 'university' ? 'Institution Portal' : 'Employer Portal'}
                        </h2>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            {authTab === 'university' ? 'Welcome back, Admin.' : 'Hire with Confidence.'}
                        </h1>
                        <p className="text-gray-400">
                            {authTab === 'university' 
                                ? 'Securely issue and manage soulbound academic credentials for your students.' 
                                : 'Access verified talent through cryptographic proofs and on-chain attestations.'}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/5">
                        <button 
                            onClick={() => setAuthTab('university')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authTab === 'university' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Institution
                        </button>
                        <button 
                            onClick={() => setAuthTab('employer')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authTab === 'employer' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Employer
                        </button>
                    </div>

                    <form onSubmit={authTab === 'university' ? handleUniversityLogin : handleEmployerLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">
                                {authTab === 'university' ? 'Work Email' : 'Employer Email'}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={authTab === 'university' ? "admin@university.edu" : "recruiter@google.corp"}
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-white"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group mt-8"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-xs mt-12 font-mono uppercase tracking-widest">
                        {authTab === 'university' ? 'Standard University Protocol 0x4A' : 'Employer Trust Layer v1.0'}
                    </p>
                </div>
            </section>

            {/* Right Side: Student Vault */}
            <section className="relative flex items-center justify-center p-8 py-20 lg:p-24 bg-[#111111] overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#ebcb900a_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ebcb90 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative w-full max-w-md text-center animate-in fade-in slide-in-from-right duration-700">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gold/10 rounded-[32px] flex items-center justify-center text-gold mb-8 ring-1 ring-gold/20 shadow-[0_0_30px_rgba(235,203,144,0.1)]">
                            <ShieldCheck size={40} />
                        </div>
                        
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/5 border border-gold/10 rounded-full text-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Sparkles size={12} /> Student Vault
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-4">Your Academic <span className="text-gold">Sovereignty</span>.</h1>
                        <p className="text-gray-400 mb-12">Connect your wallet to access your private credentials and generate cryptographic proofs.</p>

                        <div className="grid grid-cols-1 w-full gap-4">
                            <button 
                                onClick={handleStudentLogin}
                                disabled={isLoading}
                                className="w-full bg-gold hover:bg-gold-dark text-black font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-[0_10px_40px_rgba(235,203,144,0.1)] hover:shadow-[0_15px_50px_rgba(235,203,144,0.2)]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <Wallet size={22} className="group-hover:scale-110 transition-transform" />
                                        Connect Wallet to Verify
                                    </>
                                )}
                            </button>
                            
                            <Link 
                                href="/verify" 
                                className="w-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white font-medium py-4 rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2"
                            >
                                Public Verification Portal
                            </Link>
                        </div>

                        <div className="mt-16 flex items-center justify-center gap-8 opacity-20">
                            <div className="text-[10px] font-mono text-white tracking-widest uppercase">ALGORAND</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <div className="text-[10px] font-mono text-white tracking-widest uppercase">SNARKJS</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <div className="text-[10px] font-mono text-white tracking-widest uppercase">VERIDEGREE</div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
