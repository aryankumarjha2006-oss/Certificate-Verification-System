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
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.getCertificate(certId);
  }

  async getCertificateVersion(certId, version) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.getCertificateVersion(certId, version);
  }

  async getCertificateVersionCount(certId) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.getCertificateVersionCount(certId);
  }

  // Event parsing for Dashboard
  async getAllEvents() {
    if (!this.provider || !this.digitalCredential) return { certEvents: [], instEvents: [] };
    const certRegAddress = await this.digitalCredential.certificateRegistry();
    const certReg = new ethers.Contract(certRegAddress, [
      "event CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version)",
      "event CertificateRevoked(string indexed certificateId)",
      "event CertificateVersionCreated(string indexed certificateId, string newCertificateHash, uint256 newExpiryTimestamp, uint256 newVersion)"
    ], this.provider);

    const instEventsFilter = this.institutionRegistry.filters.InstitutionRegistered();
    const instEvents = await this.institutionRegistry.queryFilter(instEventsFilter, 0, "latest");

    const certIssuedFilter = certReg.filters.CertificateIssued();
    const certRevokedFilter = certReg.filters.CertificateRevoked();

    const issuedEvents = await certReg.queryFilter(certIssuedFilter, 0, "latest");
    const revokedEvents = await certReg.queryFilter(certRevokedFilter, 0, "latest");

    const safeId = (val) => typeof val === 'string' ? val : (val?.hash || String(val || ''));

    return {
       issued: issuedEvents.map(e => ({
           certId: safeId(e.args[0]),
           issuer: e.args[2],
           timestamp: e.args[3]
       })),
       revoked: revokedEvents.map(e => ({
           certId: safeId(e.args[0])
       })),
       institutions: instEvents.length
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

  async isAuthorizedIssuer(instId, walletAddress) {
    const contract = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);
    return await contract.isAuthorizedIssuer(instId, walletAddress);
  }

  async getAllInstitutions() {
    const instReg = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);
    const filter = instReg.filters.InstitutionRegistered();
    const events = await instReg.queryFilter(filter, 0, "latest");
    const institutions = [];
    const seen = new Set();

    for (const e of events) {
      let id = typeof e.args[0] === 'string' && !e.args[0].startsWith('0x') ? e.args[0] : null;
      let name = e.args[1] || 'Unknown';
      let wallet = typeof e.args[2] === 'string' ? e.args[2] : (e.args[2]?.hash || String(e.args[2] || ''));

      try {
        const tx = await this.provider.getTransaction(e.transactionHash);
        if (tx && tx.data) {
          const parsed = instReg.interface.parseTransaction({ data: tx.data });
          if (parsed && parsed.args) {
            id = parsed.args[0] || id;
            name = parsed.args[1] || name;
            wallet = parsed.args[2] || wallet;
          }
        }
      } catch (err) {
        // ignore fallback
      }

      if (!id) {
        id = typeof e.args[0] === 'string' ? e.args[0] : (e.args[0]?.hash || String(e.args[0] || ''));
      }

      if (seen.has(id)) continue;
      seen.add(id);

      institutions.push({
        id,
        name,
        wallet,
        status: 'ACTIVE'
      });
    }

    return institutions;
  }

  async getAuthorizedInstitutionsForIssuer(walletAddress) {
    if (!walletAddress) return [];
    const instReg = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);
    const all = await this.getAllInstitutions();
    const authorized = [];

    for (const inst of all) {
      try {
        const isAuth = await instReg.isAuthorizedIssuer(inst.id, walletAddress);
        const isOwner = inst.wallet.toLowerCase() === walletAddress.toLowerCase();
        if (isAuth || isOwner) {
          authorized.push({
            id: inst.id,
            name: inst.name,
            ownerWallet: inst.wallet,
            isOwner,
            isAuthorized: isAuth
          });
        }
      } catch (err) {
        console.warn(`Failed checking auth for institution ${inst.id}:`, err);
      }
    }

    return authorized;
  }

  async issueCertificateWithProof(instId, certId, hash, expiry) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");

    // Submit transaction to blockchain
    const tx = await this.digitalCredential.issueCertificate(instId, certId, hash, expiry);

    // Wait for block confirmation / receipt
    const receipt = await tx.wait();

    // Fetch block data for complete cryptographic proof
    let block = null;
    try {
      block = await this.provider.getBlock(receipt.blockNumber);
    } catch (e) {
      console.warn("Could not fetch full block details:", e);
    }

    return {
      tx,
      receipt,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      blockHash: receipt.blockHash || block?.hash || '',
      minedTimestamp: block ? Number(block.timestamp) : Math.floor(Date.now() / 1000)
    };
  }

  saveCertificateMetadata(metadata) {
    try {
      const existing = JSON.parse(localStorage.getItem('credchain_metadata') || '{}');
      existing[metadata.certificateId] = metadata;
      localStorage.setItem('credchain_metadata', JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save metadata to localStorage', e);
    }
  }

  getCertificateMetadata(certId) {
    try {
      const existing = JSON.parse(localStorage.getItem('credchain_metadata') || '{}');
      return existing[certId] || null;
    } catch (e) {
      return null;
    }
  }

  async getCertificateProof(certId) {
    try {
      const certRegAddress = await this.digitalCredential.certificateRegistry();
      const certReg = new ethers.Contract(certRegAddress, [
        "event CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version)"
      ], this.provider);
      const filter = certReg.filters.CertificateIssued(certId);
      const events = await certReg.queryFilter(filter, 0, "latest");
      if (events && events.length > 0) {
        const ev = events[events.length - 1];
        return {
          transactionHash: ev.transactionHash,
          blockNumber: Number(ev.blockNumber),
          blockHash: ev.blockHash
        };
      }
    } catch (e) {
      console.warn('Could not query CertificateIssued event for proof', e);
    }
    return null;
  }
}

export const blockchainService = new BlockchainService();
