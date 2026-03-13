"use client";
import React from 'react';
import { useWallet } from '@/lib/WalletContext';
import { Wallet, LogOut } from 'lucide-react';

export default function WalletConnect() {
    const { accountAddress, connect, disconnect } = useWallet() as any;

    return (
        <div className="flex items-center gap-4">
            {accountAddress ? (
                <div className="flex items-center gap-2 bg-card p-2 px-4 rounded-full border border-gold/30 group hover:border-gold transition-all">
                    <span className="text-xs font-mono text-gold truncate w-24">
                        {accountAddress}
                    </span>
                    <button onClick={disconnect} className="text-red-400/60 hover:text-red-500 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={connect}
                    className="flex items-center gap-2 bg-gold text-black font-bold p-2 px-6 rounded-full hover:bg-gold-dark transition-all transform hover:scale-105 active:scale-95 text-sm"
                >
                    <Wallet size={16} />
                    Connect Defly
                </button>
            )}
        </div>
    );
}
