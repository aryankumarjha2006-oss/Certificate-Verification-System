import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let provider;
let signer;
let digitalCredentialContract;
let certificateRegistryContract;

export async function connectBlockchain() {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Read ABIs directly from member-1 for convenience, or they could be copied over
    const digitalCredentialAbiPath = path.resolve(__dirname, '../../../member-1-blockchain-core/artifacts/contracts/DigitalCredential.sol/DigitalCredential.json');
    const certificateRegistryAbiPath = path.resolve(__dirname, '../../../member-1-blockchain-core/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
    
    const dcData = JSON.parse(fs.readFileSync(digitalCredentialAbiPath, 'utf8'));
    const crData = JSON.parse(fs.readFileSync(certificateRegistryAbiPath, 'utf8'));

    digitalCredentialContract = new ethers.Contract(
        process.env.DIGITAL_CREDENTIAL_ADDRESS,
        dcData.abi,
        signer
    );

    certificateRegistryContract = new ethers.Contract(
        process.env.CERTIFICATE_REGISTRY_ADDRESS,
        crData.abi,
        signer
    );
    
    console.log('Blockchain connected and contracts initialized.');
}

export function getDigitalCredentialContract() {
    return digitalCredentialContract;
}

export function getCertificateRegistryContract() {
    return certificateRegistryContract;
}
