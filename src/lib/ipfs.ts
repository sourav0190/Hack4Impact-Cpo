import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {object} metadata 
 */
export async function uploadJSONToIPFS(metadata: any) {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    
    try {
        const response = await axios.post(url, metadata, {
            headers: {
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY,
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading JSON to IPFS:", error);
        throw error;
    }
}

/**
 * Upload Image/File to IPFS via Pinata
 * @param {File} file 
 */
export async function uploadFileToIPFS(file: File) {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    
    let data = new FormData();
    data.append('file', file);

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${(data as any)._boundary || ''}`,
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY,
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw error;
    }
}
