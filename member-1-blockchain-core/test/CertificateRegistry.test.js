import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("CertificateRegistry & DigitalCredential Issuance", function () {
  let instRegistry, certRegistry, digitalCredential;
  let owner, instWallet, issuerAccount, otherAccount;
  const instId = "INST1";

  beforeEach(async function () {
    [owner, instWallet, issuerAccount, otherAccount] = await ethers.getSigners();
    
    const InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
    instRegistry = await InstitutionRegistry.deploy();
    
    await instRegistry.registerInstitution(instId, "University 1", instWallet.address);
    await instRegistry.connect(instWallet).authorizeIssuer(instId, issuerAccount.address);

    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certRegistry = await CertificateRegistry.deploy(await instRegistry.getAddress());

    const DigitalCredential = await ethers.getContractFactory("DigitalCredential");
    digitalCredential = await DigitalCredential.deploy(await instRegistry.getAddress(), await certRegistry.getAddress());
    
    // Set DigitalCredential as the facade
    await certRegistry.setFacadeAddress(await digitalCredential.getAddress());
  });

  describe("Issuance", function () {
    it("Should issue a certificate successfully", async function () {
      const expiry = Math.floor(Date.now() / 1000) + 86400; // +1 day
      await expect(
        digitalCredential.connect(issuerAccount).issueCertificate(instId, "CERT1", "hash123", expiry)
      )
        .to.emit(certRegistry, "CertificateIssued")
        .withArgs("CERT1", "hash123", issuerAccount.address, expiry, 1);

      const cert = await digitalCredential.getCertificate("CERT1");
      expect(cert.certificateHash).to.equal("hash123");
      expect(cert.issuer).to.equal(issuerAccount.address);
      expect(cert.version).to.equal(1);
      expect(cert.status).to.equal(0); // ACTIVE
    });

    it("Should reject duplicate certificate", async function () {
      await digitalCredential.connect(issuerAccount).issueCertificate(instId, "CERT1", "hash123", 0);
      await expect(
        digitalCredential.connect(issuerAccount).issueCertificate(instId, "CERT1", "hash456", 0)
      ).to.be.revertedWithCustomError(certRegistry, "CertificateAlreadyExists");
    });

    it("Should reject empty hash or ID", async function () {
      await expect(
        digitalCredential.connect(issuerAccount).issueCertificate(instId, "", "hash123", 0)
      ).to.be.revertedWithCustomError(certRegistry, "InvalidCertificateData");

      await expect(
        digitalCredential.connect(issuerAccount).issueCertificate(instId, "CERT1", "", 0)
      ).to.be.revertedWithCustomError(certRegistry, "InvalidCertificateData");
    });

    it("Should reject issuance from unauthorized user", async function () {
      await expect(
        digitalCredential.connect(otherAccount).issueCertificate(instId, "CERT1", "hash123", 0)
      ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
    });
  });

  describe("Retrieval and Verification", function () {
    it("Should return correct status for valid certificate", async function () {
      await digitalCredential.connect(issuerAccount).issueCertificate(instId, "CERT1", "hash123", 0);
      expect(await digitalCredential.verifyCertificate("CERT1", "hash123")).to.equal("VALID");
    });

    it("Should return TAMPERED for wrong hash", async function () {
      await digitalCredential.connect(issuerAccount).issueCertificate(instId, "CERT1", "hash123", 0);
      expect(await digitalCredential.verifyCertificate("CERT1", "wronghash")).to.equal("TAMPERED");
    });

    it("Should return NOT_FOUND for non-existent certificate", async function () {
      expect(await digitalCredential.verifyCertificate("CERT999", "hash")).to.equal("NOT_FOUND");
    });
  });
});
