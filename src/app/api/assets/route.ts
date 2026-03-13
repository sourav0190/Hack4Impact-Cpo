import { NextResponse } from 'next/server';
import { indexerClient, fetchAssetDetails, cleanAddress } from '@/lib/algorand';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    const addr = cleanAddress(address);
    if (!addr) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    try {
        console.log(`[API_ASSETS] Fetching assets for: ${addr}`);
        const response = await indexerClient.lookupAccountAssets(addr).do();
        const rawAssets = response.assets || [];

        // Fetch details in parallel on the server
        const assetsWithDetails = await Promise.all(
            rawAssets.map(async (asset: any) => {
                try {
                    const id = asset.assetId || asset['asset-id'];
                    const details = await fetchAssetDetails(id);
                    const name = details?.params?.name || "";
                    
                    if (name.toLowerCase().includes("degree") || name.toLowerCase().includes("badge")) {
                        return {
                            id: String(id),
                            amount: Number(asset.amount !== undefined ? asset.amount : asset['amount']),
                            name: name,
                            url: details?.params?.url || "",
                            creator: details?.params?.creator || ""
                        };
                    }
                } catch (e) {
                    console.error(`[API_ASSETS] Error fetching details for ${asset.assetId}:`, e);
                }
                return null;
            })
        );

        const filtered = assetsWithDetails.filter(a => a !== null);
        return NextResponse.json({ assets: filtered });
    } catch (error: any) {
        console.error("[API_ASSETS] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
