import { ethers } from "ethers";
import DigitalCredentialABI from "../contracts/DigitalCredential.json";
import InstitutionRegistryABI from "../contracts/InstitutionRegistry.json";

// In a real app these would be in .env, but for the local demo they can be configured here
// Replace with the addresses deployed in your local node
export const CONTRACT_ADDRESSES = {
  institutionRegistry: import.meta.env.VITE_INSTITUTION_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  digitalCredential: import.meta.env.VITE_DIGITAL_CREDENTIAL_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

export function getInjectedEthereumProvider() {
  if (typeof window === "undefined") return null;

  if (window.ethereum) {
    if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
      const metaMask = window.ethereum.providers.find(p => p.isMetaMask);
      if (metaMask) return metaMask;
      return window.ethereum.providers[0];
    }
    return window.ethereum;
  }

  return null;
}

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
    const ethereum = getInjectedEthereumProvider();
    if (!ethereum) {
      throw new Error("No Web3 wallet extension detected. Please install MetaMask to connect your wallet.");
    }

    try {
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      if (err && (err.code === 4001 || err.code === 'ACTION_REJECTED' || (err.message && err.message.includes('rejected')))) {
        throw new Error("Wallet connection request was rejected in MetaMask.");
      }
      throw new Error(err.message || "Failed to request accounts from wallet.");
    }

    this.provider = new ethers.BrowserProvider(ethereum);
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
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
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
    const contract = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);
    return await contract.getInstitution(instId);
  }

  async getAllRegisteredInstitutions() {
    const candidateIds = new Set(['DEMO_INST_01', 'INST-001', 'INST-002', 'UNIV01']);

    try {
      const res = await fetch('http://localhost:3000/api/certificates');
      if (res.ok) {
        const certs = await res.json();
        certs.forEach(c => { if (c.institutionId) candidateIds.add(c.institutionId); });
      }
    } catch(e) {}

    const contract = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);

    const list = [];
    for (const id of candidateIds) {
      try {
        const inst = await contract.getInstitution(id);
        if (inst && (inst.exists || inst[4])) {
          list.push({
            id: String(inst.id || inst[0] || id),
            name: String(inst.name || inst[1] || 'Unknown Institution'),
            wallet: String(inst.wallet || inst[2] || '0x000'),
            isActive: Boolean(inst.isActive ?? inst[3] ?? true)
          });
        }
      } catch(e) {}
    }
    return list;
  }

  async getAllAuthorizedIssuers() {
    const institutions = await this.getAllRegisteredInstitutions();
    const contract = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);

    const candidateWallets = new Set([
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdD459693451D78155437276156522617737',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
    ]);

    try {
      const authEvents = await contract.queryFilter(contract.filters.IssuerAuthorized(), 0, "latest");
      authEvents.forEach(e => {
        if (e.args[1]) candidateWallets.add(e.args[1]);
      });
    } catch(e) {}

    const issuersList = [];
    for (const inst of institutions) {
      if (inst.wallet) candidateWallets.add(inst.wallet);

      for (const wallet of candidateWallets) {
        try {
          const isAuth = await contract.isAuthorizedIssuer(inst.id, wallet);
          const isPrimary = inst.wallet && inst.wallet.toLowerCase() === wallet.toLowerCase();
          if (isAuth || isPrimary) {
            issuersList.push({
              instId: inst.id,
              instName: inst.name,
              wallet: wallet,
              status: 'AUTHORIZED',
              isPrimary
            });
          }
        } catch(e) {}
      }
    }
    return issuersList;
  }

  async isAuthorizedIssuer(instId, issuerWallet) {
    const contract = this.institutionRegistry || new ethers.Contract(CONTRACT_ADDRESSES.institutionRegistry, InstitutionRegistryABI.abi, this.provider);

    try {
      const inst = await contract.getInstitution(instId);
      if (!inst || !inst.exists || !inst.isActive) {
        return { isAuthorized: false, reason: `Institution "${instId}" does not exist or is inactive.` };
      }

      const isAuth = await contract.isAuthorizedIssuer(instId, issuerWallet);

      // If isAuth is true OR if connected wallet matches institution primary wallet
      const isPrimaryWallet = inst.wallet && inst.wallet.toLowerCase() === issuerWallet.toLowerCase();

      if (isAuth || isPrimaryWallet) {
        return { isAuthorized: true, institution: inst, isPrimary: isPrimaryWallet };
      }

      return {
        isAuthorized: false,
        reason: `Wallet ${issuerWallet.substring(0, 6)}...${issuerWallet.substring(38)} is not an authorized issuer for ${inst.name} (${instId}).`
      };
    } catch (err) {
      return { isAuthorized: false, reason: err.reason || err.message || "Failed to query institution contract authorization." };
    }
  }

  // --- Certificate operations ---
  async issueCertificate(instId, certId, hash, expiry) {
    if (!this.signer) throw new Error("MetaMask wallet is not connected");
    const contract = this.digitalCredential.connect(this.signer);
    return await contract.issueCertificate(instId, certId, hash, expiry);
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
