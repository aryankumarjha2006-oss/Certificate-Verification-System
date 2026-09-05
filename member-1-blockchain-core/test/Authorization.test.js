import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Authorization", function () {
  let InstitutionRegistry, registry, owner, instWallet, issuerAccount, otherAccount;

  beforeEach(async function () {
    [owner, instWallet, issuerAccount, otherAccount] = await ethers.getSigners();
    InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
    registry = await InstitutionRegistry.deploy();
    await registry.registerInstitution("INST1", "University 1", instWallet.address);
  });

  it("Should authorize an issuer", async function () {
    await expect(registry.connect(instWallet).authorizeIssuer("INST1", issuerAccount.address))
      .to.emit(registry, "IssuerAuthorized")
      .withArgs("INST1", issuerAccount.address);

    expect(await registry.isAuthorizedIssuer("INST1", issuerAccount.address)).to.be.true;
  });

  it("Should revoke an issuer", async function () {
    await registry.connect(instWallet).authorizeIssuer("INST1", issuerAccount.address);
    expect(await registry.isAuthorizedIssuer("INST1", issuerAccount.address)).to.be.true;

    await expect(registry.connect(instWallet).revokeIssuer("INST1", issuerAccount.address))
      .to.emit(registry, "IssuerRevoked")
      .withArgs("INST1", issuerAccount.address);

    expect(await registry.isAuthorizedIssuer("INST1", issuerAccount.address)).to.be.false;
  });

  it("Should reject unauthorized issuer management", async function () {
    await expect(
      registry.connect(otherAccount).authorizeIssuer("INST1", issuerAccount.address)
    ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");

    await registry.connect(instWallet).authorizeIssuer("INST1", issuerAccount.address);
    
    await expect(
      registry.connect(otherAccount).revokeIssuer("INST1", issuerAccount.address)
    ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
  });

  it("Should reject authorization if institution is inactive", async function () {
    await registry.deactivateInstitution("INST1");
    await expect(
      registry.connect(instWallet).authorizeIssuer("INST1", issuerAccount.address)
    ).to.be.revertedWithCustomError(registry, "InstitutionInactive");
  });

  it("isAuthorizedIssuer should return false if institution is inactive", async function () {
    await registry.connect(instWallet).authorizeIssuer("INST1", issuerAccount.address);
    await registry.deactivateInstitution("INST1");
    expect(await registry.isAuthorizedIssuer("INST1", issuerAccount.address)).to.be.false;
  });
});
