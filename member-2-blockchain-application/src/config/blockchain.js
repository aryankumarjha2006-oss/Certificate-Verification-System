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
let institutionRegistryContract;

// Institutional Signer Accounts for Local Development / Hardhat Node
// Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 -> DEMO_INST_01, UNIV01, INST-001
// Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -> INST-002
// Account #3: 0x90F79bf6EB2c4f8090B5E0109d1750572E23707D -> INST-003
const DEV_INSTITUTION_KEYS = {
    'DEMO_INST_01': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    'UNIV01': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    'INST-001': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    'INST-002': '0x5de4111daf190123ca4321316f6e10423790202130e63e423257d63be074946a',
    'INST-003': '0x7c852118294e373a230248b79986934c2c02353a9e70d7350582769f9c299935'
};

const DEFAULT_INST_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // Account #1

export async function connectBlockchain() {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
    signer = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

    // Read ABIs directly from member-1
    const digitalCredentialAbiPath = path.resolve(__dirname, '../../../member-1-blockchain-core/artifacts/contracts/DigitalCredential.sol/DigitalCredential.json');
    const certificateRegistryAbiPath = path.resolve(__dirname, '../../../member-1-blockchain-core/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
    const institutionRegistryAbiPath = path.resolve(__dirname, '../../../member-1-blockchain-core/artifacts/contracts/InstitutionRegistry.sol/InstitutionRegistry.json');
    
    const dcData = JSON.parse(fs.readFileSync(digitalCredentialAbiPath, 'utf8'));
    const crData = JSON.parse(fs.readFileSync(certificateRegistryAbiPath, 'utf8'));
    const irData = JSON.parse(fs.readFileSync(institutionRegistryAbiPath, 'utf8'));

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

    const instRegAddress = await digitalCredentialContract.institutionRegistry();
    institutionRegistryContract = new ethers.Contract(
        instRegAddress,
        irData.abi,
        signer
    );
    
    console.log('Blockchain connected and contracts initialized.');

    // Ensure all development institutions are registered and authorized on-chain
    await ensureInstitutionalAuthorizations();
}

async function ensureInstitutionalAuthorizations() {
    try {
        console.log('Verifying on-chain institutional wallet authorizations...');
        const inst1Signer = new ethers.Wallet(DEFAULT_INST_KEY, provider); // Account #1
        const inst2Signer = new ethers.Wallet(DEV_INSTITUTION_KEYS['INST-002'], provider); // Account #2

        const devInstitutions = [
            { id: 'DEMO_INST_01', name: 'Global Tech University', wallet: inst1Signer.address, signer: inst1Signer },
            { id: 'UNIV01', name: 'State University', wallet: inst1Signer.address, signer: inst1Signer },
            { id: 'INST-001', name: 'Institute One', wallet: inst1Signer.address, signer: inst1Signer },
            { id: 'INST-002', name: 'Polytechnic Institute', wallet: inst2Signer.address, signer: inst2Signer }
        ];

        for (const inst of devInstitutions) {
            let instExists = false;
            try {
                const existing = await institutionRegistryContract.getInstitution(inst.id);
                instExists = existing.exists;
            } catch (e) {}

            if (!instExists) {
                console.log(`Registering institution ${inst.id} on-chain...`);
                const tx = await institutionRegistryContract.registerInstitution(inst.id, inst.name, inst.wallet);
                await tx.wait();
            }

            // Ensure issuer wallet is authorized on-chain
            const isAuth = await institutionRegistryContract.isAuthorizedIssuer(inst.id, inst.wallet);
            if (!isAuth) {
                console.log(`Authorizing wallet ${inst.wallet} on-chain for ${inst.id}...`);
                const instRegAsInst = institutionRegistryContract.connect(inst.signer);
                try {
                    const tx = await instRegAsInst.authorizeIssuer(inst.id, inst.wallet);
                    await tx.wait();
                } catch (authErr) {
                    // If deployer is wallet owner, try authorizing via deployer
                    const tx = await institutionRegistryContract.authorizeIssuer(inst.id, inst.wallet);
                    await tx.wait();
                }
            }
        }
        console.log('Institutional wallet authorizations verified on-chain.');
    } catch (err) {
        console.warn('Institutional auto-authorization warning (non-fatal):', err.message || err);
    }
}

export function getProvider() {
    return provider;
}

const institutionSignersCache = {};

export function getInstitutionSigner(institutionId) {
    if (!institutionId || typeof institutionId !== 'string' || !institutionId.trim()) {
        throw new Error('No blockchain signing identity configured for institution: undefined');
    }

    const rawId = institutionId.trim();
    const instKey = rawId.toUpperCase();

    if (!institutionSignersCache[instKey]) {
        // Look up explicit key in DEV_INSTITUTION_KEYS or environment
        const matchedKey = DEV_INSTITUTION_KEYS[rawId] ||
                           DEV_INSTITUTION_KEYS[instKey] ||
                           process.env[`INST_KEY_${instKey}`] ||
                           process.env[`INST_KEY_${rawId}`];

        if (!matchedKey) {
            throw new Error(`No blockchain signing identity configured for institution: ${rawId}`);
        }

        institutionSignersCache[instKey] = new ethers.Wallet(matchedKey, provider);
    }
    return institutionSignersCache[instKey];
}

export async function verifyInstitutionSignerOnChain(institutionId, signerAddress) {
    const rawId = (institutionId || '').trim();
    if (!rawId) {
        throw new Error('Institution ID is required');
    }

    try {
        const inst = await institutionRegistryContract.getInstitution(rawId);
        if (!inst.exists) {
            throw new Error(`Institution '${rawId}' is not registered on the blockchain.`);
        }
        if (!inst.isActive) {
            throw new Error(`Institution '${rawId}' is marked as inactive on-chain.`);
        }

        const registeredWallet = inst.wallet;
        const isAuthorized = await institutionRegistryContract.isAuthorizedIssuer(rawId, signerAddress);

        if (registeredWallet.toLowerCase() !== signerAddress.toLowerCase() && !isAuthorized) {
            throw new Error(`Configured signer wallet (${signerAddress}) does not match registered on-chain wallet (${registeredWallet}) or authorized issuer for institution: ${rawId}`);
        }
    } catch (err) {
        if (err.message && (err.message.includes('InstitutionDoesNotExist') || err.message.includes('does not exist'))) {
            throw new Error(`Institution '${rawId}' is not registered on the blockchain.`);
        }
        throw err;
    }
}

export async function getLiveNonce(signer) {
    const address = await signer.getAddress();
    const hexCount = await provider.send('eth_getTransactionCount', [address, 'pending']);
    return parseInt(hexCount, 16);
}

export function getDigitalCredentialContractForInstitution(institutionId) {
    const instSigner = getInstitutionSigner(institutionId);
    return digitalCredentialContract.connect(instSigner);
}

export function getDigitalCredentialContract() {
    return digitalCredentialContract;
}

export function getCertificateRegistryContract() {
    return certificateRegistryContract;
}

export function getInstitutionRegistryContract() {
    return institutionRegistryContract;
}

export function parseContractError(error) {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;

    if (error.message) {
        if (error.message.includes('No blockchain signing identity configured')) {
            return error.message;
        }
        if (error.message.includes('does not match registered on-chain wallet')) {
            return error.message;
        }
        if (error.message.includes('is not registered on the blockchain')) {
            return error.message;
        }
        if (error.message.includes('is marked as inactive')) {
            return error.message;
        }
    }

    const data = error.data || error.info?.error?.data?.data || error.info?.error?.data;
    if (data && typeof data === 'string') {
        const errorHash = data.substring(0, 10).toLowerCase();
        if (errorHash === '0xb41ba2d6') {
            return 'UnauthorizedIssuer: The designated institutional wallet is not authorized as an issuer on-chain for this institution.';
        }
        if (errorHash === '0xa31b2c8e') {
            return 'InstitutionDoesNotExist: The specified institution ID is not registered on the blockchain.';
        }
        if (errorHash === '0x5c427cd9') {
            return 'UnauthorizedCaller: Only the registered institution primary wallet can perform this operation.';
        }
        if (errorHash === '0x60098a58') {
            return 'CertificateAlreadyExists: A certificate with this ID already exists on the blockchain.';
        }
        if (errorHash === '0xfd576a91') {
            return 'CertificateAlreadyRevoked: This certificate has already been revoked on-chain.';
        }
        if (errorHash === '0x91d9d150') {
            return 'InvalidCertificateData: Certificate ID or document hash cannot be empty.';
        }
    }

    return error.reason || error.message || String(error);
}
