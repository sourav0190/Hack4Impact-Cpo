import { NextResponse } from 'next/server';
import { generateNativeDisclosure } from '@/lib/nativeVerify';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');
        const assetId = searchParams.get('assetId');
        const threshold = searchParams.get('threshold');

        if (!address || !assetId || !threshold) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        console.log(`[API_ZK] Generating proof for ${address}, asset ${assetId}, threshold ${threshold}`);
        
        const proofData = await generateNativeDisclosure(
            address, 
            Number(assetId), 
            parseFloat(threshold)
        );

        return NextResponse.json(proofData);
    } catch (error: any) {
        console.error("[API_ZK] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
