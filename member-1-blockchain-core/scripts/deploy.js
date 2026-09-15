import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error(
      `No deployer account found for network "${hre.network.name}". ` +
      `Ensure PRIVATE_KEY or SEPOLIA_PRIVATE_KEY is configured in .env for remote networks.`
    );
  }

  const network = await hre.ethers.provider.getNetwork();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("==================================================");
  console.log("CredChain Smart Contract Deployment");
  console.log("==================================================");
  console.log(`Network:       ${hre.network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer:      ${deployer.address}`);
  console.log(`Balance:       ${hre.ethers.formatEther(balance)} ETH`);
  console.log("--------------------------------------------------");

  // 1. Deploy InstitutionRegistry
  console.log("\n[1/3] Deploying InstitutionRegistry...");
  const InstitutionRegistry = await hre.ethers.getContractFactory("InstitutionRegistry");
  const institutionRegistry = await InstitutionRegistry.deploy();
  await institutionRegistry.waitForDeployment();
  const institutionRegistryAddress = await institutionRegistry.getAddress();
  const irDeployTx = institutionRegistry.deploymentTransaction();
  console.log(`  -> Deployed to: ${institutionRegistryAddress}`);
  if (irDeployTx) console.log(`  -> Tx Hash:     ${irDeployTx.hash}`);

  // 2. Deploy CertificateRegistry
  console.log("\n[2/3] Deploying CertificateRegistry...");
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy(institutionRegistryAddress);
  await certificateRegistry.waitForDeployment();
  const certificateRegistryAddress = await certificateRegistry.getAddress();
  const crDeployTx = certificateRegistry.deploymentTransaction();
  console.log(`  -> Deployed to: ${certificateRegistryAddress}`);
  if (crDeployTx) console.log(`  -> Tx Hash:     ${crDeployTx.hash}`);

  // 3. Deploy DigitalCredential (Facade)
  console.log("\n[3/3] Deploying DigitalCredential (Facade)...");
  const DigitalCredential = await hre.ethers.getContractFactory("DigitalCredential");
  const digitalCredential = await DigitalCredential.deploy(institutionRegistryAddress, certificateRegistryAddress);
  await digitalCredential.waitForDeployment();
  const digitalCredentialAddress = await digitalCredential.getAddress();
  const dcDeployTx = digitalCredential.deploymentTransaction();
  console.log(`  -> Deployed to: ${digitalCredentialAddress}`);
  if (dcDeployTx) console.log(`  -> Tx Hash:     ${dcDeployTx.hash}`);

  // 4. Connect Facade to CertificateRegistry
  console.log("\n[Link] Connecting Facade to CertificateRegistry...");
  const linkTx = await certificateRegistry.setFacadeAddress(digitalCredentialAddress);
  await linkTx.wait();
  console.log(`  -> Facade linked successfully (Tx: ${linkTx.hash})`);

  console.log("\n==================================================");
  console.log("DEPLOYMENT COMPLETE — CONFIGURED ADDRESSES");
  console.log("==================================================");
  console.log(`INSTITUTION_REGISTRY_ADDRESS=${institutionRegistryAddress}`);
  console.log(`CERTIFICATE_REGISTRY_ADDRESS=${certificateRegistryAddress}`);
  console.log(`DIGITAL_CREDENTIAL_ADDRESS=${digitalCredentialAddress}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("\nDeployment failed:", error.message || error);
  process.exitCode = 1;
});
