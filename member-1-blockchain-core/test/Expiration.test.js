import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const { ethers } = hre;

describe("Expiration", function () {
  let instRegistry, certRegistry, digitalCredential;
  let owner, instWallet, issuerAccount;
  const instId = "INST1";
  const certId = "CERT1";

  beforeEach(async function () {
    [owner, instWallet, issuerAccount] = await ethers.getSigners();
    
    const InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
    instRegistry = await InstitutionRegistry.deploy();
    await instRegistry.registerInstitution(instId, "University 1", instWallet.address);
    await instRegistry.connect(instWallet).authorizeIssuer(instId, issuerAccount.address);

    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certRegistry = await CertificateRegistry.deploy(await instRegistry.getAddress());

    const DigitalCredential = await ethers.getContractFactory("DigitalCredential");
    digitalCredential = await DigitalCredential.deploy(await instRegistry.getAddress(), await certRegistry.getAddress());
    
    await certRegistry.setFacadeAddress(await digitalCredential.getAddress());
  });

  it("Should return VALID for non-expired certificate", async function () {
    const latestTime = await time.latest();
    const expiry = latestTime + 86400; // +1 day
    await digitalCredential.connect(issuerAccount).issueCertificate(instId, certId, "hash123", expiry);

    expect(await digitalCredential.verifyCertificate(certId, "hash123")).to.equal("VALID");
  });

  it("Should return EXPIRED when current time exceeds expiry", async function () {
    const latestTime = await time.latest();
    const expiry = latestTime + 3600; // +1 hour
    await digitalCredential.connect(issuerAccount).issueCertificate(instId, certId, "hash123", expiry);

    // Fast forward time by 2 hours
    await time.increase(7200);

    expect(await digitalCredential.verifyCertificate(certId, "hash123")).to.equal("EXPIRED");
  });
});
