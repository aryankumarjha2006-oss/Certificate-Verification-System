import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Deploy InstitutionRegistry
  const InstitutionRegistry = await hre.ethers.getContractFactory("InstitutionRegistry");
  const institutionRegistry = await InstitutionRegistry.deploy();
  await institutionRegistry.waitForDeployment();
  const institutionRegistryAddress = await institutionRegistry.getAddress();
  console.log("InstitutionRegistry deployed to:", institutionRegistryAddress);

  // Deploy CertificateRegistry
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy(institutionRegistryAddress);
  await certificateRegistry.waitForDeployment();
  const certificateRegistryAddress = await certificateRegistry.getAddress();
  console.log("CertificateRegistry deployed to:", certificateRegistryAddress);

  // Deploy DigitalCredential
  const DigitalCredential = await hre.ethers.getContractFactory("DigitalCredential");
  const digitalCredential = await DigitalCredential.deploy(institutionRegistryAddress, certificateRegistryAddress);
  await digitalCredential.waitForDeployment();
  const digitalCredentialAddress = await digitalCredential.getAddress();
  console.log("DigitalCredential deployed to:", digitalCredentialAddress);

  // Connect Facade
  await certificateRegistry.setFacadeAddress(digitalCredentialAddress);
  console.log("DigitalCredential connected as facade to CertificateRegistry");

  console.log("\n--- contract addresses ---");
  console.log(`InstitutionRegistry: ${institutionRegistryAddress}`);
  console.log(`CertificateRegistry: ${certificateRegistryAddress}`);
  console.log(`DigitalCredential: ${digitalCredentialAddress}`);
  console.log("--------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
