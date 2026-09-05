# Blockchain-Based Digital Credential Trust & Lifecycle Platform (Core)

This repository contains the blockchain infrastructure, smart contracts, authorization logic, lifecycle management, deployment scripts, and tests for **Member 1 (Blockchain Core Engineer)**.

## Architecture

The system utilizes Ethereum smart contracts written in Solidity (^0.8.20).
It is split into three main contracts for a clean separation of concerns:

1. **InstitutionRegistry.sol**: Manages educational institutions and their authorized issuers. Implements basic role-based access control.
2. **CertificateRegistry.sol**: Manages the lifecycle of digital certificates (issuance, revocation, expiration, and versioning). Relies on `InstitutionRegistry` for authorization.
3. **DigitalCredential.sol**: Acts as a facade/interface for Member 2 to discover and interact with the platform.

## Technology Stack
- **Node.js**: Environment
- **Hardhat**: Ethereum development environment for compilation, testing, and local network.
- **Solidity**: Smart contract programming language.
- **Ethers.js**: Library for interacting with the Ethereum blockchain.
- **Chai / Mocha**: Testing framework.

## Installation

1. Navigate to this directory.
2. Run `npm install` to install Hardhat and dependencies.

```bash
npm install
```

## Compilation

To compile the Solidity smart contracts and generate the artifacts (ABIs):

```bash
npx hardhat compile
```

## Testing

A comprehensive test suite is provided to ensure all constraints, permissions, and lifecycle rules are met.

```bash
npx hardhat test
```

Test coverage includes:
- Institution Registry operations
- Authorization flows
- Certificate Issuance & Retrieval
- Certificate Revocation
- Certificate Expiration dynamically evaluated
- Certificate Versioning

## Running Local Blockchain

To spin up a local Hardhat node for the Member 2 application to connect to:

```bash
npx hardhat node
```

## Deployment

To deploy the contracts to the local network (ensure the node is running in another terminal):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

To deploy and setup demo data (Institution, Issuer, Certificate):

```bash
npx hardhat run scripts/setupDemo.js --network localhost
```

## Security Considerations
- **No Private Keys Hardcoded**: All deployment should use environment variables (via `.env`).
- **Data Minimization**: No PII or large documents are stored on-chain. Only cryptographic hashes are stored to guarantee privacy and save gas.
- **Role-Based Access**: Strict modifiers and checks ensure only authorized institutions can authorize issuers, and only authorized issuers can manage certificates.

## Member 2 Integration
Please refer to `docs/integration-guide.md` for detailed instructions on contract addresses, ABI locations, and code snippets for interacting with the blockchain from the backend.
