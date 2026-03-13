"use client";
import React, { useEffect, useState } from 'react';
import { indexerClient } from '@/lib/algorand';
import { ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function EmbedBadgePage() {
    const params = useParams();
    const assetId = params?.assetId as string | undefined;
    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

    useEffect(() => {
        if (!assetId) return;

        async function checkAsset() {
            try {
                const response = await indexerClient.lookupAssetBalances(Number(assetId)).do();
                // If anyone holds the asset (amount > 0)
                // In SBT logic, the creator might hold it initially, 
                // but usually the student opts-in and creator transfers it.
                // We assume if it's held by anyone it's valid for this widget's demo purposes.
                const holder = response.balances.find((b: any) => BigInt(b.amount) > 0n);
                
                if (holder) {
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                }
            } catch (error) {
                console.error("Error checking asset:", error);
                setStatus('invalid');
            }
        }

        checkAsset();
    }, [assetId]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#EBCB90]/20 rounded-2xl p-6 w-[280px] h-[130px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                {/* Decorative gold gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EBCB90] to-transparent opacity-30" />
                
                {status === 'loading' ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-[#EBCB90]" size={32} />
                        <span className="text-[#EBCB90]/60 text-[10px] font-mono tracking-widest uppercase">Verifying...</span>
                    </div>
                ) : status === 'valid' ? (
                    <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <ShieldCheck size={40} className="text-[#EBCB90]" />
                            <div className="absolute inset-0 bg-[#EBCB90]/20 rounded-full animate-ping" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-[#EBCB90] font-bold text-sm tracking-tight">Verified on Algorand</h3>
                            <p className="text-[#EBCB90]/40 text-[9px] font-mono mt-0.5">ID: {assetId}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                        <XCircle size={40} className="text-red-500/80" />
                        <div className="text-center">
                            <h3 className="text-red-500/80 font-bold text-sm tracking-tight">Invalid Credential</h3>
                            <p className="text-red-500/40 text-[9px] font-mono mt-0.5">ID: {assetId}</p>
                        </div>
                    </div>
                )}

                {/* Subtle Brand Tag */}
                <div className="absolute bottom-2 right-3">
                    <span className="text-[7px] font-bold text-[#EBCB90]/20 tracking-[0.2em] uppercase">VeriDegree</span>
                </div>
            </div>
        </div>
    );
}
