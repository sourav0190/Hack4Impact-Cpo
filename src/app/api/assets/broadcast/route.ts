import { NextResponse } from 'next/server';
import { algodClient, waitForConfirmation } from '@/lib/algorand';

export async function POST(request: Request) {
    try {
        const { signedTxn } = await request.json();

        if (!signedTxn) {
            return NextResponse.json({ error: 'Missing signedTxn' }, { status: 400 });
        }

        console.log(`[API_BROADCAST] Broadcasting signed txn...`);
        
        // Convert base64 signed txn back to Uint8Array
        const signedTxnBytes = Buffer.from(signedTxn, 'base64');
        
        const { txid } = await algodClient.sendRawTransaction(signedTxnBytes).do();
        
        console.log(`[API_BROADCAST] Sent! TXID: ${txid}`);
        
        // Optional: Wait for confirmation on the server to ensure it's finalized
        await waitForConfirmation(algodClient, txid, 4);

        return NextResponse.json({ txid });
    } catch (error: any) {
        console.error("[API_BROADCAST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
