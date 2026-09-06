import { expect } from "chai";
import hre from "hardhat";
import crypto from "crypto";

describe("Institution-Controlled Certificate Issuance E2E Workflow", function () {
  const { ethers } = hre;
  let instRegistry, certRegistry, digitalCredential;
  let owner, instWallet, issuerAccount, unauthorizedWallet;
  const instId = "INST_E2E_01";

  before(async function () {
    [owner, instWallet, issuerAccount, unauthorizedWallet] = await ethers.getSigners();

    const InstReg = await ethers.getContractFactory("InstitutionRegistry");
    instRegistry = await InstReg.deploy();
    await instRegistry.waitForDeployment();

    const CertReg = await ethers.getContractFactory("CertificateRegistry");
    certRegistry = await CertReg.deploy(await instRegistry.getAddress());
    await certRegistry.waitForDeployment();

    const DC = await ethers.getContractFactory("DigitalCredential");
    digitalCredential = await DC.deploy(await instRegistry.getAddress(), await certRegistry.getAddress());
    await digitalCredential.waitForDeployment();

    await certRegistry.setFacadeAddress(await digitalCredential.getAddress());

    await instRegistry.registerInstitution(instId, "E2E Tech Institute", instWallet.address);
    await instRegistry.connect(instWallet).authorizeIssuer(instId, issuerAccount.address);
  });

  it("Should reject unauthorized wallet issuance", async function () {
    const certId = `CERT_UNAUTH_${Date.now()}`;
    const docHash = "0x" + "1".repeat(64);
    await expect(
      digitalCredential.connect(unauthorizedWallet).issueCertificate(instId, certId, docHash, 0)
    ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
  });

  it("Should issue certificate via authorized issuer wallet and verify PDF hash", async function () {
    const certId = `CERT_E2E_${Date.now()}`;
    const mockPdfBuffer = Buffer.from(`%PDF-1.4 Certificate ID: ${certId} Student: Bob Smith Institution: E2E Tech Institute`);
    const docHash = "0x" + crypto.createHash('sha256').update(mockPdfBuffer).digest('hex');

    const tx = await digitalCredential.connect(issuerAccount).issueCertificate(instId, certId, docHash, 0);
    await tx.wait();

    const certOnChain = await digitalCredential.getCertificate(certId);
    expect(certOnChain.issuer.toLowerCase()).to.equal(issuerAccount.address.toLowerCase());
    expect(certOnChain.certificateHash).to.equal(docHash);

    const onChainStatus = await digitalCredential.verifyCertificate(certId, docHash);
    expect(onChainStatus).to.equal("VALID");

    // Tampered check
    const tamperedBuffer = Buffer.from(mockPdfBuffer);
    tamperedBuffer[tamperedBuffer.length - 1] ^= 0xFF;
    const tamperedHash = "0x" + crypto.createHash('sha256').update(tamperedBuffer).digest('hex');
    const tamperedStatus = await digitalCredential.verifyCertificate(certId, tamperedHash);
    expect(tamperedStatus).to.equal("TAMPERED");
  });
});
