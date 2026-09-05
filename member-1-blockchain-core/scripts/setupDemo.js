import hre from "hardhat";

async function main() {
  const [deployer, instWallet, issuerAccount] = await hre.ethers.getSigners();

  console.log("Setting up demo data...");

  const InstitutionRegistry = await hre.ethers.getContractFactory("InstitutionRegistry");
  const institutionRegistry = await InstitutionRegistry.deploy();
  await institutionRegistry.waitForDeployment();
  const instRegistryAddr = await institutionRegistry.getAddress();

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy(instRegistryAddr);
  await certificateRegistry.waitForDeployment();
  const certRegistryAddr = await certificateRegistry.getAddress();

  const DigitalCredential = await hre.ethers.getContractFactory("DigitalCredential");
  const digitalCredential = await DigitalCredential.deploy(instRegistryAddr, certRegistryAddr);
  await digitalCredential.waitForDeployment();
  
  await certificateRegistry.setFacadeAddress(await digitalCredential.getAddress());
  console.log("Contracts deployed for demo.");

  // 1. Register Institution
  console.log("Registering Demo Institution...");
  const instId = "DEMO_INST_01";
  await institutionRegistry.registerInstitution(instId, "Global Tech University", instWallet.address);

  // 2. Authorize Issuer
  console.log("Authorizing Demo Issuer...");
  await institutionRegistry.connect(instWallet).authorizeIssuer(instId, issuerAccount.address);

  // 3. Issue Certificate via Facade
  console.log("Issuing Demo Certificate...");
  const certId = "CERT_2026_001";
  const certHash = "0x" + "1".repeat(64); // mock hash
  const expiry = 0; // no expiry
  await digitalCredential.connect(issuerAccount).issueCertificate(instId, certId, certHash, expiry);

  console.log("Demo setup complete.");
  console.log(`Institution Wallet: ${instWallet.address}`);
  console.log(`Issuer Wallet: ${issuerAccount.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
