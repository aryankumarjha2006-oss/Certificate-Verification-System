import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("InstitutionRegistry", function () {
  let InstitutionRegistry, registry, owner, instWallet, otherAccount;

  beforeEach(async function () {
    [owner, instWallet, otherAccount] = await ethers.getSigners();
    InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
    registry = await InstitutionRegistry.deploy();
  });

  describe("Registration", function () {
    it("Should register a new institution successfully", async function () {
      await expect(registry.registerInstitution("INST1", "University 1", instWallet.address))
        .to.emit(registry, "InstitutionRegistered")
        .withArgs("INST1", "University 1", instWallet.address);

      const inst = await registry.getInstitution("INST1");
      expect(inst.name).to.equal("University 1");
      expect(inst.wallet).to.equal(instWallet.address);
      expect(inst.isActive).to.be.true;
    });

    it("Should reject duplicate institution ID", async function () {
      await registry.registerInstitution("INST1", "University 1", instWallet.address);
      await expect(
        registry.registerInstitution("INST1", "University 2", otherAccount.address)
      ).to.be.revertedWithCustomError(registry, "InstitutionAlreadyExists");
    });

    it("Should reject empty institution ID or name", async function () {
      await expect(
        registry.registerInstitution("", "University 1", instWallet.address)
      ).to.be.revertedWithCustomError(registry, "InvalidInstitutionData");
      
      await expect(
        registry.registerInstitution("INST1", "", instWallet.address)
      ).to.be.revertedWithCustomError(registry, "InvalidInstitutionData");
    });

    it("Should reject registration from unauthorized caller", async function () {
      await expect(
        registry.connect(otherAccount).registerInstitution("INST1", "University 1", instWallet.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Deactivation & Retrieval", function () {
    beforeEach(async function () {
      await registry.registerInstitution("INST1", "University 1", instWallet.address);
    });

    it("Should retrieve an existing institution", async function () {
      const inst = await registry.getInstitution("INST1");
      expect(inst.id).to.equal("INST1");
    });

    it("Should revert when retrieving a non-existent institution", async function () {
      await expect(registry.getInstitution("INST2")).to.be.revertedWithCustomError(registry, "InstitutionDoesNotExist");
    });

    it("Should deactivate an active institution", async function () {
      await expect(registry.deactivateInstitution("INST1"))
        .to.emit(registry, "InstitutionDeactivated")
        .withArgs("INST1");

      const isActive = await registry.isInstitutionActive("INST1");
      expect(isActive).to.be.false;
    });

    it("Should revert deactivation for non-existent institution", async function () {
      await expect(registry.deactivateInstitution("INST2")).to.be.revertedWithCustomError(registry, "InstitutionDoesNotExist");
    });
  });
});
