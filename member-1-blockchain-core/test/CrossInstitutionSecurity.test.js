import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Cross-Institution Security Fix", function () {
  let instRegistry, certRegistry, digitalCredential;
  let owner, instAWallet, issuerA, instBWallet, issuerB;
  const instAId = "INST_A";
  const instBId = "INST_B";
  const certId = "CERT_INST_A_001";
  const certHash = "0xhashA";

  beforeEach(async function () {
    [owner, instAWallet, issuerA, instBWallet, issuerB] = await ethers.getSigners();
    
    const InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
    instRegistry = await InstitutionRegistry.deploy();
    
    // Register Institution A & authorize Issuer A
    await instRegistry.registerInstitution(instAId, "University A", instAWallet.address);
    await instRegistry.connect(instAWallet).authorizeIssuer(instAId, issuerA.address);

    // Register Institution B & authorize Issuer B
    await instRegistry.registerInstitution(instBId, "University B", instBWallet.address);
    await instRegistry.connect(instBWallet).authorizeIssuer(instBId, issuerB.address);

    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certRegistry = await CertificateRegistry.deploy(await instRegistry.getAddress());

    const DigitalCredential = await ethers.getContractFactory("DigitalCredential");
    digitalCredential = await DigitalCredential.deploy(await instRegistry.getAddress(), await certRegistry.getAddress());
    
    await certRegistry.setFacadeAddress(await digitalCredential.getAddress());

    // 1. Institution A's issuer issues a certificate
    await digitalCredential.connect(issuerA).issueCertificate(instAId, certId, certHash, 0);
  });

  it("Institution B's authorized issuer attempting to revoke Institution A's certificate must fail", async function () {
    // Issuer B passes their own valid instBId and caller issuerB
    await expect(
      digitalCredential.connect(issuerB).revokeCertificate(instBId, certId)
    ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
  });

  it("Institution B's authorized issuer attempting to create a new version of Institution A's certificate must fail", async function () {
    await expect(
      digitalCredential.connect(issuerB).createNewVersion(instBId, certId, "0xnewHash", 0)
    ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
  });

  it("Institution A's authorized issuer must still succeed in revocation and versioning", async function () {
    // Versioning by Issuer A succeeds
    await expect(
      digitalCredential.connect(issuerA).createNewVersion(instAId, certId, "0xversion2Hash", 0)
    ).to.emit(certRegistry, "CertificateVersionCreated");

    let cert = await digitalCredential.getCertificate(certId);
    expect(cert.version).to.equal(2);
    expect(cert.certificateHash).to.equal("0xversion2Hash");

    // Revocation by Issuer A succeeds
    await expect(
      digitalCredential.connect(issuerA).revokeCertificate(instAId, certId)
    ).to.emit(certRegistry, "CertificateRevoked");

    cert = await digitalCredential.getCertificate(certId);
    expect(await digitalCredential.verifyCertificate(certId, "0xversion2Hash")).to.equal("REVOKED");
  });
});
