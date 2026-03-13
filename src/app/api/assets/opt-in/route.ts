import { NextResponse } from 'next/server';
import { algodClient, optInAsset, cleanAddress } from '@/lib/algorand';
import algosdk from 'algosdk';

export async function POST(request: Request) {
    try {
        const { address, assetId } = await request.json();

        if (!address || !assetId) {
            return NextResponse.json({ error: 'Missing address or assetId' }, { status: 400 });
        }

        const addr = cleanAddress(address);
        if (!addr) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        console.log(`[API_OPTIN] Generating opt-in for ${addr}, asset ${assetId}`);
        
        // Use the existing utility but we need to return something the client can use
        const txn = await optInAsset(addr, Number(assetId));
        
        // Encode the transaction to base64 so it can be sent over JSON
        const encodedTxn = Buffer.from(txn.toByte()).toString('base64');

        return NextResponse.json({ 
            txn: encodedTxn,
            msg: "Transfer this base64 txn to your wallet for signing"
        });
    } catch (error: any) {
        console.error("[API_OPTIN] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
