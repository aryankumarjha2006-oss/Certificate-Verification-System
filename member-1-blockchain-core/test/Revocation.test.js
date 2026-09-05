import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Revocation", function () {
  let instRegistry, certRegistry, digitalCredential;
  let owner, instWallet, issuerAccount, otherAccount;
  const instId = "INST1";
  const certId = "CERT1";

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
    
    await certRegistry.setFacadeAddress(await digitalCredential.getAddress());
    
    await digitalCredential.connect(issuerAccount).issueCertificate(instId, certId, "hash123", 0);
  });

  it("Should revoke an existing certificate", async function () {
    await expect(digitalCredential.connect(issuerAccount).revokeCertificate(instId, certId))
      .to.emit(certRegistry, "CertificateRevoked")
      .withArgs(certId);
      
    expect(await digitalCredential.verifyCertificate(certId, "hash123")).to.equal("REVOKED");
  });
  
  it("Institution wallet should be able to revoke", async function () {
    await expect(digitalCredential.connect(instWallet).revokeCertificate(instId, certId))
      .to.emit(certRegistry, "CertificateRevoked")
      .withArgs(certId);
  });

  it("Should reject unauthorized revocation", async function () {
    await expect(
      digitalCredential.connect(otherAccount).revokeCertificate(instId, certId)
    ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
  });

  it("Should reject double revocation", async function () {
    await digitalCredential.connect(issuerAccount).revokeCertificate(instId, certId);
    await expect(
      digitalCredential.connect(issuerAccount).revokeCertificate(instId, certId)
    ).to.be.revertedWithCustomError(certRegistry, "CertificateAlreadyRevoked");
  });
});
