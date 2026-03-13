"use client";
import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="relative z-10 pt-24 pb-12 px-6 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10 opacity-30" />
            
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold ring-1 ring-gold/20 group-hover:ring-gold/40 transition-all">
                                <span className="text-xl font-bold tracking-tighter">V</span>
                            </div>
                            <span className="text-2xl font-black text-white tracking-widest uppercase">Veri<span className="text-gold italic">Degree</span></span>
                        </Link>
                        <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
                            The world's first standardized protocol for decentralized academic trust. 
                            Built on Algorand for ultimate security and transparency.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { Icon: Github, href: "https://github.com" },
                                { Icon: Twitter, href: "https://twitter.com" },
                                { Icon: Linkedin, href: "https://linkedin.com" }
                            ].map((social, i) => (
                                <a 
                                    key={i} 
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 transition-all"
                                >
                                    <social.Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-[0.2em]">Protocol</h4>
                        <ul className="space-y-4">
                            {['Verification', 'Issuance', 'ZKP Proofs', 'Smart Assets'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-gray-400 hover:text-gold transition-all text-sm font-medium">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-[0.2em]">Resources</h4>
                        <ul className="space-y-4">
                            {['Documentation', 'API Reference', 'Developer Hub', 'Node Status'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-gray-400 hover:text-gold transition-all text-sm font-medium">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                        <span>© 2026 VeriDegree Protocol</span>
                        <span className="hidden md:block">•</span>
                        <span>Built on Algorand Mainnet</span>
                    </div>
                    <div className="flex gap-8 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                        <Link href="#" className="hover:text-gold transition-all">Privacy</Link>
                        <Link href="#" className="hover:text-gold transition-all">Security</Link>
                        <Link href="#" className="hover:text-gold transition-all">Governance</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
