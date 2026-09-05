import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Versioning", function () {
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
    
    await digitalCredential.connect(issuerAccount).issueCertificate(instId, certId, "hash1", 0);
  });

  it("Should create a new version and increment version number", async function () {
    let cert = await digitalCredential.getCertificate(certId);
    expect(cert.version).to.equal(1);
    expect(cert.certificateHash).to.equal("hash1");

    await expect(
      digitalCredential.connect(issuerAccount).createNewVersion(instId, certId, "hash2", 0)
    )
      .to.emit(certRegistry, "CertificateVersionCreated")
      .withArgs(certId, "hash2", 0, 2);

    cert = await digitalCredential.getCertificate(certId);
    expect(cert.version).to.equal(2);
    expect(cert.certificateHash).to.equal("hash2");
  });

  it("Should reject unauthorized version creation", async function () {
    await expect(
      digitalCredential.connect(otherAccount).createNewVersion(instId, certId, "hash2", 0)
    ).to.be.revertedWithCustomError(certRegistry, "UnauthorizedIssuer");
  });
});
