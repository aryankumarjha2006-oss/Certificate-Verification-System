import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Issuer Certificate Generation & Verification Flow", function () {
  let instRegistry, certRegistry, digitalCredential;
  let deployer, instWallet, issuerAccount, unauthorizedAccount;
  const instId = "DEMO_INST_01";
  const instName = "Debug University";

  // Helper for canonical hashing matching frontend utility
  function createCanonicalCredentialPayload(data) {
    return JSON.stringify({
      certificateId: String(data.certificateId || '').trim(),
      expiryDate: String(data.expiryDate || 'Never').trim(),
      institutionId: String(data.institutionId || '').trim(),
      institutionName: String(data.institutionName || '').trim(),
      issueDate: String(data.issueDate || '').trim(),
      purpose: String(data.purpose || '').trim(),
      studentName: String(data.studentName || '').trim()
    });
  }

  function generateCredentialHash(data) {
    return ethers.sha256(ethers.toUtf8Bytes(createCanonicalCredentialPayload(data)));
  }

  beforeEach(async function () {
    [deployer, instWallet, issuerAccount, unauthorizedAccount] = await ethers.getSigners();

    const InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
    instRegistry = await InstitutionRegistry.deploy();
    await instRegistry.waitForDeployment();

    await instRegistry.registerInstitution(instId, instName, instWallet.address);
    await instRegistry.connect(instWallet).authorizeIssuer(instId, issuerAccount.address);

    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certRegistry = await CertificateRegistry.deploy(await instRegistry.getAddress());
    await certRegistry.waitForDeployment();

    const DigitalCredential = await ethers.getContractFactory("DigitalCredential");
    digitalCredential = await DigitalCredential.deploy(
      await instRegistry.getAddress(),
      await certRegistry.getAddress()
    );
    await digitalCredential.waitForDeployment();

    await certRegistry.setFacadeAddress(await digitalCredential.getAddress());
  });

  it("Should allow authorized issuer to issue certificate with deterministic canonical hash and produce real block proof", async function () {
    const certData = {
      institutionId: instId,
      institutionName: instName,
      studentName: "Rahul Sharma",
      certificateId: "CERT-2026-001",
      purpose: "Successful Completion of Blockchain Technology Course",
      issueDate: "2026-09-06",
      expiryDate: "2027-12-31"
    };

    const certHash = generateCredentialHash(certData);
    expect(certHash).to.be.a("string");
    expect(certHash.startsWith("0x")).to.be.true;
    expect(certHash.length).to.equal(66);

    const expiryTimestamp = Math.floor(new Date("2027-12-31").getTime() / 1000);

    const tx = await digitalCredential.connect(issuerAccount).issueCertificate(
      instId,
      certData.certificateId,
      certHash,
      expiryTimestamp
    );

    const receipt = await tx.wait();

    // Verify real blockchain proof
    expect(receipt.hash).to.be.a("string");
    expect(receipt.blockNumber).to.be.greaterThan(0);
    expect(receipt.blockHash).to.be.a("string");
    expect(receipt.blockHash.startsWith("0x")).to.be.true;

    // Verify stored on-chain certificate
    const cert = await digitalCredential.getCertificate(certData.certificateId);
    expect(cert.certificateId).to.equal(certData.certificateId);
    expect(cert.certificateHash).to.equal(certHash);
    expect(cert.issuer).to.equal(issuerAccount.address);
    expect(cert.institutionId).to.equal(instId);
    expect(cert.status).to.equal(0); // ACTIVE
  });

  it("Should reject certificate issuance from unauthorized wallet", async function () {
    const certData = {
      institutionId: instId,
      institutionName: instName,
      studentName: "Mallory Attacker",
      certificateId: "CERT-FAKE-001",
      purpose: "Unauthorized Course",
      issueDate: "2026-09-06",
      expiryDate: "Never"
    };

    const certHash = generateCredentialHash(certData);

    await expect(
      digitalCredential.connect(unauthorizedAccount).issueCertificate(
        instId,
        certData.certificateId,
        certHash,
        0
      )
    ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
  });

  it("Should reject duplicate certificate ID", async function () {
    const certData = {
      institutionId: instId,
      institutionName: instName,
      studentName: "Rahul Sharma",
      certificateId: "CERT-DUP-001",
      purpose: "Course 1",
      issueDate: "2026-09-06",
      expiryDate: "Never"
    };

    const certHash = generateCredentialHash(certData);

    await digitalCredential.connect(issuerAccount).issueCertificate(
      instId,
      certData.certificateId,
      certHash,
      0
    );

    // Second issuance with same ID must fail
    await expect(
      digitalCredential.connect(issuerAccount).issueCertificate(
        instId,
        certData.certificateId,
        certHash,
        0
      )
    ).to.be.revertedWithCustomError(certRegistry, "CertificateAlreadyExists");
  });

  it("Should correctly return VALID, TAMPERED, REVOKED, and EXPIRED statuses", async function () {
    const certData = {
      institutionId: instId,
      institutionName: instName,
      studentName: "Rahul Sharma",
      certificateId: "CERT-STATUS-001",
      purpose: "Status Test Course",
      issueDate: "2026-09-06",
      expiryDate: "2026-09-07"
    };

    const certHash = generateCredentialHash(certData);
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    await digitalCredential.connect(issuerAccount).issueCertificate(
      instId,
      certData.certificateId,
      certHash,
      expiryTimestamp
    );

    // 1. VALID with matching hash
    const validStatus = await digitalCredential.verifyCertificate(certData.certificateId, certHash);
    expect(validStatus).to.equal("VALID");

    // 2. TAMPERED with modified hash
    const tamperedData = { ...certData, studentName: "Tampered Student" };
    const tamperedHash = generateCredentialHash(tamperedData);
    const tamperedStatus = await digitalCredential.verifyCertificate(certData.certificateId, tamperedHash);
    expect(tamperedStatus).to.equal("TAMPERED");

    // 3. EXPIRED when time passes
    await ethers.provider.send("evm_increaseTime", [3700]);
    await ethers.provider.send("evm_mine");

    const expiredStatus = await digitalCredential.verifyCertificate(certData.certificateId, certHash);
    expect(expiredStatus).to.equal("EXPIRED");

    // 4. REVOKED when revoked
    await digitalCredential.connect(issuerAccount).revokeCertificate(instId, certData.certificateId);
    const revokedStatus = await digitalCredential.verifyCertificate(certData.certificateId, certHash);
    expect(revokedStatus).to.equal("REVOKED");

    // 5. NOT_FOUND for non-existent certificate
    const notFoundStatus = await digitalCredential.verifyCertificate("NON-EXISTENT", certHash);
    expect(notFoundStatus).to.equal("NOT_FOUND");
  });
});
