import { ethers } from "ethers";
import DigitalCredentialABI from "../contracts/DigitalCredential.json";
import InstitutionRegistryABI from "../contracts/InstitutionRegistry.json";

// In a real app these would be in .env, but for the local demo they can be configured here
// Replace with the addresses deployed in your local node
export const CONTRACT_ADDRESSES = {
  institutionRegistry: import.meta.env.VITE_INSTITUTION_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  digitalCredential: import.meta.env.VITE_DIGITAL_CREDENTIAL_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    this.signer = null;
    this.digitalCredential = new ethers.Contract(
      CONTRACT_ADDRESSES.digitalCredential,
      DigitalCredentialABI.abi,
      this.provider
    );
    this.institutionRegistry = new ethers.Contract(
      CONTRACT_ADDRESSES.institutionRegistry,
      InstitutionRegistryABI.abi,
      this.provider
    );
  }

  async connectWallet() {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed!");
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    this.digitalCredential = new ethers.Contract(
      CONTRACT_ADDRESSES.digitalCredential,
      DigitalCredentialABI.abi,
      this.signer
    );

    this.institutionRegistry = new ethers.Contract(
      CONTRACT_ADDRESSES.institutionRegistry,
      InstitutionRegistryABI.abi,
      this.signer
    );

    const address = await this.signer.getAddress();

    let netName = "Unknown Network";
    try {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      if (chainId === 31337) {
        netName = "Hardhat Local";
      } else if (chainId === 1) {
        netName = "Mainnet";
      } else if (chainId === 1337 || chainId === 1338) {
        netName = "Localhost";
      } else {
        const network = await this.provider.getNetwork();
        netName = network.name === "unknown" ? `Chain ${chainId}` : network.name;
      }
    } catch (e) {
      const network = await this.provider.getNetwork();
      netName = network.name === "unknown" ? "Localhost" : network.name;
    }

    return {
      address,
      network: netName
    };
  }

  getWalletAddress() {
    if (!this.signer) return null;
    return this.signer.getAddress();
  }

  // --- Institution operations ---
  async registerInstitution(id, name, wallet) {
    if (!this.institutionRegistry) throw new Error("Wallet not connected");
    return await this.institutionRegistry.registerInstitution(id, name, wallet);
  }

  async authorizeIssuer(instId, issuerWallet) {
    if (!this.institutionRegistry) throw new Error("Wallet not connected");
    return await this.institutionRegistry.authorizeIssuer(instId, issuerWallet);
  }

  async getInstitution(instId) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.getInstitution(instId);
  }

  // --- Certificate operations ---
  async issueCertificate(instId, certId, hash, expiry) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.issueCertificate(instId, certId, hash, expiry);
  }

  async verifyCertificate(certId, hash) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.verifyCertificate(certId, hash);
  }

  async getCertificate(certId) {
    const contract = this.digitalCredential || new ethers.Contract(CONTRACT_ADDRESSES.digitalCredential, DigitalCredentialABI.abi, this.provider);
    return await contract.getCertificate(certId);
  }

  async getCertificateVersion(certId, version) {
    const contract = this.digitalCredential || new ethers.Contract(CONTRACT_ADDRESSES.digitalCredential, DigitalCredentialABI.abi, this.provider);
    return await contract.getCertificateVersion(certId, version);
  }

  async getCertificateVersionCount(certId) {
    const contract = this.digitalCredential || new ethers.Contract(CONTRACT_ADDRESSES.digitalCredential, DigitalCredentialABI.abi, this.provider);
    return await contract.getCertificateVersionCount(certId);
  }

  async getCredentials() {
    let certList = [];
    try {
      const res = await fetch('http://localhost:3000/api/certificates');
      if (res.ok) {
        certList = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch off-chain certificates, falling back to local/contract state", e);
    }

    try {
      const local = JSON.parse(localStorage.getItem('credchain_local_certs') || '[]');
      for (const lc of local) {
        if (!certList.find(c => c.id === lc.id)) {
          certList.push(lc);
        }
      }
    } catch (e) {}

    const enriched = [];
    const contract = this.digitalCredential || new ethers.Contract(CONTRACT_ADDRESSES.digitalCredential, DigitalCredentialABI.abi, this.provider);

    for (const cert of certList) {
      const certId = cert.id;
      if (!certId) continue;
      try {
        const onChain = await contract.getCertificate(certId);
        if (onChain && (onChain[7] ?? onChain.exists)) {
          const issueTimestamp = Number(onChain[3] ?? onChain.issueTimestamp ?? 0);
          const expiryTimestamp = Number(onChain[4] ?? onChain.expiryTimestamp ?? 0);
          const statusNum = Number(onChain[5] ?? onChain.status ?? 0);
          const versionNum = Number(onChain[6] ?? onChain.version ?? 1);

          enriched.push({
            certId: String(onChain[0] || certId),
            issuer: String(onChain[2] || onChain.issuer || '0x000'),
            issueTimestamp,
            expiryTimestamp,
            status: statusNum === 1 ? 'REVOKED' : 'ACTIVE',
            version: versionNum,
            institutionId: String(onChain[8] || onChain.institutionId || cert.institutionId || ''),
            hash: String(onChain[1] || onChain.certificateHash || '')
          });
        }
      } catch (err) {
        console.warn(`Certificate ${certId} in database not found on current active blockchain; skipping.`);
      }
    }

    return enriched;
  }

  // Event and credentials parsing for Dashboard & Lists
  async getAllEvents() {
    if (!this.provider || !this.digitalCredential) return { issued: [], revoked: [], institutions: 0 };

    let institutionsCount = 0;
    try {
      const instEventsFilter = this.institutionRegistry.filters.InstitutionRegistered();
      const instEvents = await this.institutionRegistry.queryFilter(instEventsFilter, 0, "latest");
      institutionsCount = instEvents.length;
    } catch (e) {}

    const credentials = await this.getCredentials();

    const issued = credentials.map(c => ({
      certId: c.certId,
      issuer: c.issuer,
      timestamp: c.issueTimestamp,
      status: c.status,
      version: c.version,
      institutionId: c.institutionId
    }));

    const revoked = credentials.filter(c => c.status === 'REVOKED').map(c => ({
      certId: c.certId
    }));

    return {
       issued,
       revoked,
       institutions: institutionsCount
    };
  }

  async revokeCertificate(instId, certId) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.revokeCertificate(instId, certId);
  }

  async createNewVersion(instId, certId, newHash, newExpiry) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.createNewVersion(instId, certId, newHash, newExpiry);
  }
}

export const blockchainService = new BlockchainService();
