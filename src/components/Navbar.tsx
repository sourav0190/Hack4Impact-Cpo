"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useWallet } from '@/lib/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    GraduationCap, 
    Github, 
    LogOut, 
    Wallet, 
    LayoutDashboard, 
    FilePlus, 
    Search,
    ShieldCheck,
    Menu,
    X,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const { disconnect } = useWallet() as any;
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        if ((session?.user as any)?.role === "STUDENT") {
            disconnect();
        }
        toast.success("Signed out successfully");
        router.push("/");
    };

    const isActive = (path: string) => pathname === path;

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 py-4 ${isScrolled ? 'pt-4' : 'pt-6'}`}>
            <div className={`max-w-7xl mx-auto glass rounded-[2rem] px-8 h-16 flex justify-between items-center transition-all duration-500 ${isScrolled ? 'shadow-gold-glow border-gold/20 bg-black/60' : 'border-white/5'}`}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20 group-hover:border-gold transition-all duration-500 shadow-gold-glow">
                        <GraduationCap size={22} className="text-gold group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className="text-xl font-black text-white tracking-widest uppercase hidden lg:block">Veri<span className="text-gold italic">Degree</span></span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link 
                        href="/verify"
                        className={`text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive('/verify') ? 'text-gold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Search size={14} /> Verify
                    </Link>

                    {(session?.user as any)?.role === "UNIVERSITY" && (
                        <Link 
                            href="/issue"
                            className={`text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive('/issue') ? 'text-gold' : 'text-gray-400 hover:text-white'}`}
                        >
                            <FilePlus size={14} /> Issue
                        </Link>
                    )}

                    {(session?.user as any)?.role === "STUDENT" && (
                        <>
                            <Link 
                                href="/dashboard"
                                className={`text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive('/dashboard') ? 'text-gold' : 'text-gray-400 hover:text-white'}`}
                            >
                                <LayoutDashboard size={14} /> My Vault
                            </Link>
                            <Link 
                                href="/assess"
                                className={`text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive('/assess') ? 'text-gold' : 'text-gray-400 hover:text-white'}`}
                            >
                                <GraduationCap size={14} /> Assess
                            </Link>
                        </>
                    )}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <AnimatePresence mode="wait">
                        {status === "loading" ? (
                            <div className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl opacity-50">
                                <Loader2 size={16} className="animate-spin text-gold" />
                                <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Identifying...</span>
                            </div>
                        ) : session ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-4"
                            >
                                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl ring-1 ring-white/5">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${(session.user as any)?.role === "UNIVERSITY" ? 'bg-blue-400' : 'bg-gold'}`} />
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest max-w-[100px] truncate">
                                        {(session.user as any)?.role === "UNIVERSITY" ? "Institution" : ((session.user as any)?.address?.slice(0, 4) + "..." + (session.user as any)?.address?.slice(-4))}
                                    </span>
                                </div>

                                <button 
                                    onClick={handleSignOut}
                                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 group"
                                >
                                    <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-4"
                            >
                                <Link 
                                    href="/login"
                                    className="bg-gold hover:bg-gold-dark text-black font-black px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-gold-glow hover:-translate-y-0.5 active:scale-95"
                                >
                                    <ShieldCheck size={16} />
                                    <span>Sign In</span>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="h-6 w-px bg-white/10 hidden lg:block" />

                    <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2.5 glass text-gray-400 rounded-xl hover:text-gold hover:border-gold/30 transition-all hidden lg:flex"
                    >
                        <Github size={18} />
                    </a>

                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-400 hover:text-white"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden absolute top-24 left-6 right-6 p-6 rounded-[2rem] glass border border-white/10 shadow-2xl flex flex-col gap-6"
                    >
                        {/* Links */}
                        <div className="flex flex-col gap-4">
                            <Link 
                                href="/verify"
                                className={`text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 ${isActive('/verify') ? 'text-gold bg-gold/5' : 'text-gray-400'}`}
                            >
                                <Search size={16} /> Verify Portal
                            </Link>

                            {(session?.user as any)?.role === "UNIVERSITY" && (
                                <Link 
                                    href="/issue"
                                    className={`text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 ${isActive('/issue') ? 'text-gold bg-gold/5' : 'text-gray-400'}`}
                                >
                                    <FilePlus size={16} /> Issue Degree
                                </Link>
                            )}

                            {(session?.user as any)?.role === "STUDENT" && (
                                <>
                                    <Link 
                                        href="/dashboard"
                                        className={`text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 ${isActive('/dashboard') ? 'text-gold bg-gold/5' : 'text-gray-400'}`}
                                    >
                                        <LayoutDashboard size={16} /> My Vault
                                    </Link>
                                    <Link 
                                        href="/assess"
                                        className={`text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 ${isActive('/assess') ? 'text-gold bg-gold/5' : 'text-gray-400'}`}
                                    >
                                        <GraduationCap size={16} /> Skill Assessment
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="pt-6 border-t border-white/10">
                            {session ? (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${(session.user as any)?.role === "UNIVERSITY" ? 'bg-blue-400' : 'bg-gold'}`} />
                                        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                                            {(session.user as any)?.role === "UNIVERSITY" ? "Institution" : ((session.user as any)?.address?.slice(0, 4) + "..." + (session.user as any)?.address?.slice(-4))}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleSignOut}
                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ) : (
                                <Link 
                                    href="/login"
                                    className="w-full bg-gold hover:bg-gold-dark text-black font-black px-6 py-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                >
                                    <ShieldCheck size={18} />
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
