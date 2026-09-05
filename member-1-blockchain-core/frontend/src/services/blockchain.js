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
    this.provider = null;
    this.signer = null;
    this.digitalCredential = null;
    this.institutionRegistry = null;
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
    const network = await this.provider.getNetwork();
    
    return {
      address,
      network: network.name === "unknown" ? "Localhost" : network.name
    };
  }

  getWalletAddress() {
    if (!this.signer) return null;
    return this.signer.getAddress();
  }

  // --- Institution operations ---
  async registerInstitution(id, name, wallet) {
    if (!this.institutionRegistry) throw new Error("Wallet not connected");
    const tx = await this.institutionRegistry.registerInstitution(id, name, wallet);
    return await tx.wait();
  }

  async authorizeIssuer(instId, issuerWallet) {
    if (!this.institutionRegistry) throw new Error("Wallet not connected");
    const tx = await this.institutionRegistry.authorizeIssuer(instId, issuerWallet);
    return await tx.wait();
  }
  
  async getInstitution(instId) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    return await this.digitalCredential.getInstitution(instId);
  }

  // --- Certificate operations ---
  async issueCertificate(instId, certId, hash, expiry) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    const tx = await this.digitalCredential.issueCertificate(instId, certId, hash, expiry);
    return await tx.wait();
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

  async revokeCertificate(instId, certId) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    const tx = await this.digitalCredential.revokeCertificate(instId, certId);
    return await tx.wait();
  }

  async createNewVersion(instId, certId, newHash, newExpiry) {
    if (!this.digitalCredential) throw new Error("Wallet not connected");
    const tx = await this.digitalCredential.createNewVersion(instId, certId, newHash, newExpiry);
    return await tx.wait();
  }
}

export const blockchainService = new BlockchainService();
