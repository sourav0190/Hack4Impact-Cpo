import { indexerClient, fetchAssetDetails } from './algorand';

export interface NativeProof {
    studentAddress: string;
    assetId: number;
    threshold: number;
    verified: boolean;
    timestamp: string;
    signature: string;
}

/**
 * Generate a Native Verification Proof based on on-chain ASA metadata
 * @param {string} studentAddress - Wallet address of the student
 * @param {number} assetId - The ASA ID
 * @param {number} threshold - The target CGPA threshold
 */
export async function generateNativeDisclosure(studentAddress: string, assetId: number, threshold: number): Promise<NativeProof> {
    try {
        // 1. Verify student holds the asset
        const accountAssets = await indexerClient.lookupAccountAssets(studentAddress).assetId(assetId).do();
        if (!accountAssets.assets || accountAssets.assets.length === 0 || BigInt(accountAssets.assets[0].amount) === 0n) {
            throw new Error("Student does not hold this asset on the Algorand blockchain");
        }

        // 2. Fetch Asset Metadata
        const asset = await fetchAssetDetails(assetId);
        const assetUrl = asset.params.url;
        if (!assetUrl) {
            throw new Error("Asset does not have a metadata URL");
        }

        // 3. Resolve IPFS Metadata
        let metadataUrl = assetUrl;
        if (assetUrl.startsWith("ipfs://")) {
            metadataUrl = `https://gateway.pinata.cloud/ipfs/${assetUrl.replace("ipfs://", "")}`;
        }

        const response = await fetch(metadataUrl);
        const metadata = await response.json();

        // 4. Verify Condition natively
        const actualCGPA = parseFloat(metadata.cgpa);
        if (isNaN(actualCGPA)) {
            throw new Error("Invalid CGPA in on-chain metadata");
        }

        if (actualCGPA < threshold) {
            throw new Error(`CGPA (${actualCGPA}) is below the required threshold (${threshold})`);
        }

        return {
            studentAddress,
            assetId,
            threshold,
            verified: true,
            timestamp: new Date().toISOString(),
            signature: "ALGORAND_NATIVE_VERIFIED"
        };
    } catch (error) {
        console.error("Error generating native disclosure:", error);
        throw error;
    }
}

/**
 * Verify a Native Disclosure Proof
 */
export async function verifyNativeDisclosure(proof: NativeProof): Promise<boolean> {
    try {
        if (!proof.verified || !proof.studentAddress || !proof.assetId || proof.signature !== "ALGORAND_NATIVE_VERIFIED") {
            return false;
        }

        // Re-verify on-chain to prevent forged proofs
        const accountAssets = await indexerClient.lookupAccountAssets(proof.studentAddress).assetId(proof.assetId).do();
        if (!accountAssets.assets || accountAssets.assets.length === 0 || BigInt(accountAssets.assets[0].amount) === 0n) {
            return false;
        }

        const asset = await fetchAssetDetails(proof.assetId);
        const assetUrl = asset.params.url;
        if (!assetUrl) return false;

        let metadataUrl = assetUrl;
        if (assetUrl.startsWith("ipfs://")) {
            metadataUrl = `https://gateway.pinata.cloud/ipfs/${assetUrl.replace("ipfs://", "")}`;
        }

        const response = await fetch(metadataUrl);
        const metadata = await response.json();

        const actualCGPA = parseFloat(metadata.cgpa);
        return actualCGPA >= proof.threshold;
    } catch (error) {
        console.error("Error verifying native disclosure:", error);
        return false;
    }
}
