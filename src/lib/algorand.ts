import algosdk, { waitForConfirmation } from 'algosdk';
export { waitForConfirmation };

const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

const INDEXER_TOKEN = '';
const INDEXER_SERVER = 'https://testnet-idx.algonode.cloud';
const INDEXER_PORT = '';

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
export const indexerClient = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT);

/**
 * Clean and validate an Algorand address
 */
export function cleanAddress(addr: string | null | undefined): string | null {
    if (!addr) return null;
    const cleaned = String(addr).replace(/\s/g, "").trim();
    const isValid = algosdk.isValidAddress(cleaned);
    console.log("[DEBUG] cleanAddress called with:", addr, "Result:", isValid ? cleaned : "INVALID");
    return isValid ? cleaned : null;
}

/**
 * Mint a Soulbound Token (ASA)
 */
export async function mintSBT(creatorAddr: string, studentAddr: string, assetName: string, assetUrl: string) {
    const cAddr = cleanAddress(creatorAddr);
    const sAddr = cleanAddress(studentAddr);

    console.log("[DEBUG_V3] mintSBT positional call with:", { 
        cAddr, 
        sAddr, 
        assetName, 
        assetUrl 
    });

    if (!cAddr) throw new Error("Invalid or missing creator address: " + creatorAddr);
    if (!sAddr) throw new Error("Invalid or missing student address: " + studentAddr);

    try {
        const params = await algodClient.getTransactionParams().do();
        
        // v3 migration: use object-based parameters for maximum reliability
        const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
            sender: cAddr,
            suggestedParams: params,
            total: BigInt(1),
            decimals: 0,
            defaultFrozen: true,
            manager: cAddr,
            reserve: cAddr,
            freeze: cAddr,
            clawback: cAddr,
            assetName: String(assetName),
            unitName: "VDGR",
            assetURL: String(assetUrl),
            note: new Uint8Array(),
            assetMetadataHash: undefined,
            rekeyTo: undefined
        });

        return txn;
    } catch (error) {
        console.error("[CRITICAL] mintSBT internal failure:", error);
        throw error;
    }
}

export async function optInAsset(userAddr: string, assetIndex: number | string | bigint) {
    const addr = cleanAddress(userAddr);
    if (!addr) throw new Error("Invalid user address");
    
    const params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: addr,
        receiver: addr,
        assetIndex: Number(assetIndex),
        amount: 0n,
        suggestedParams: params,
        note: new Uint8Array(),
        rekeyTo: undefined
    });
    return txn;
}

export async function transferAsset(creatorAddr: string, studentAddr: string, assetIndex: number | string | bigint) {
    const cAddr = cleanAddress(creatorAddr);
    const sAddr = cleanAddress(studentAddr);
    if (!cAddr || !sAddr) throw new Error("Invalid address provided for transfer");

    const params = await algodClient.getTransactionParams().do();
    // Use Clawback (assetSender) to bypass the defaultFrozen status of the Soulbound Token
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: cAddr,
        receiver: sAddr,
        assetSender: cAddr, // The account from which the asset is being clawed back
        assetIndex: Number(assetIndex),
        amount: 1n, // Transfer 1 unit of the SBT
        suggestedParams: params,
        note: new Uint8Array(),
        rekeyTo: undefined
    });
    return txn;
}

export async function fetchUserAssets(address: string) {
    const addr = cleanAddress(address);
    if (!addr) return [];
    try {
        const response = await indexerClient.lookupAccountAssets(addr).do();
        console.log("[DEBUG] Raw Indexer Assets:", response.assets);
        // v2/v3 compatibility check: handle both asset-id and assetId
        return (response.assets || []).map((asset: any) => {
            const id = asset.assetId || asset['asset-id'];
            const amt = asset.amount !== undefined ? asset.amount : asset['amount'];
            return {
                ...asset,
                assetId: Number(id),
                amount: Number(amt),
                optedInAtRound: asset.optedInAtRound ? Number(asset.optedInAtRound) : undefined,
                optedOutAtRound: asset.optedOutAtRound ? Number(asset.optedOutAtRound) : undefined
            };
        });
    } catch (e) {
        console.error("fetchUserAssets error:", e);
        return [];
    }
}

export async function fetchAssetDetails(assetIndex: number | string | bigint) {
    try {
        const response = await algodClient.getAssetByID(Number(assetIndex)).do();
        // In algosdk v3, the response contains `index` and `params` directly at the top level
        return response;
    } catch (e) {
        console.error("fetchAssetDetails error:", e);
        return null;
    }
}

export const executeTalentBounty = async (senderAddress: string, studentAddress: string, universityAddress: string, signTransactionProvider: any) => {
    const sAddr = cleanAddress(senderAddress);
    const stAddr = cleanAddress(studentAddress);
    const uAddr = cleanAddress(universityAddress);
    
    if(!sAddr || !stAddr || !uAddr) throw new Error("Invalid addresses for bounty");

    const params = await algodClient.getTransactionParams().do();
    
    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: sAddr,
        receiver: stAddr,
        amount: BigInt(4000000), // 4 ALGO
        suggestedParams: params
    });

    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: sAddr,
        receiver: uAddr,
        amount: BigInt(1000000), // 1 ALGO
        suggestedParams: params
    });

    const txns = [txn1, txn2];
    algosdk.assignGroupID(txns);

    const groupedTxns = txns.map(txn => ({ txn, signers: [sAddr] }));
    const signedTxns = await signTransactionProvider.signTransaction([groupedTxns]);
    
    const { txid } = await algodClient.sendRawTransaction(signedTxns).do();
    await waitForConfirmation(algodClient, txid, 4);
    
    return txid;
};
