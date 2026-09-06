# Member 2: Blockchain Application & CredChain Managed Signing Layer

This directory contains the off-chain Express REST backend, SQLite indexing database, Ethers.js blockchain integration, and CredChain Managed Signing infrastructure for the Blockchain Certificate Verification System.

---

## 🏛️ Architecture & System Philosophy

CredChain delivers a **Web2-like seamless user experience with genuine, uncompromised Web3 blockchain-backed trust underneath**.

### Core UX Goal
**Institutions and public verifiers do NOT need to install MetaMask, browser wallet extensions, or manage gas fees.**
* **Institutions** log in, fill certificate details, compile PDFs, and issue credentials seamlessly through the web application.
* **CredChain Backend** securely signs smart contract transactions on-chain using distinct, institution-specific wallet identities.
* **Smart Contracts** (`DigitalCredential.sol`, `CertificateRegistry.sol`, `InstitutionRegistry.sol`) remain the authoritative source of truth for all certificate verification and lifecycle operations.
* **Public Verifiers & Students** scan QR codes or upload PDFs for 100% wallet-free instant verification.

```
Institution User
       ↓
CredChain Web App (REST API + JWT Auth)
       ↓
Secure Institutional Signing Layer (getInstitutionSigner(institutionId))
       ↓
Smart Contract (msg.sender = Institution Authorized Wallet)
       ↓
Hardhat / Ethereum Blockchain (On-Chain State & Events)
       ↓
SQLite Indexer & Off-Chain Metadata Cache
```

---

## 🔐 On-Chain vs. Off-Chain Data Separation

| Storage Domain | Data Fields Retained | Responsibility & Trust Model |
| :--- | :--- | :--- |
| **On-Chain (Blockchain)** | `certificateId`, `certificateHash` (SHA-256), `issuer` (Institutional Wallet), `issueTimestamp`, `expiryTimestamp`, `status` (ACTIVE/REVOKED), `version`, `institutionId` | **Authoritative Source of Truth.** Immutable, tamper-evident, decentralized execution. |
| **Off-Chain (SQLite & Server)** | Student Name, Course Name, Issue Date, PDF Storage/Buffers, Verification Logs, User Credentials, Auth Tokens | **Presentation & Privacy Layer.** Protects student PII and enables rich application search/indexing. |

> **Security Note:** Blockchain provides a tamper-evident record of the certificate's cryptographic proof and lifecycle state. PII (Personally Identifiable Information) is NEVER stored on the blockchain or inside QR codes.

---

## 🛡️ Production Key Management & Custody Architecture

For local development and testing, CredChain uses Hardhat development accounts mapped to institution IDs (`DEMO_INST_01` -> Account #1 `0x7099...79C8`, `INST-002` -> Account #2 `0x3C44...93BC`).

For production deployment, the local signer key resolver (`getInstitutionSigner`) can be seamlessly swapped to enterprise key custody solutions:

1. **Cloud KMS / HSM (AWS KMS / GCP Cloud KMS / Azure Key Vault)**:
   * Private keys are generated and locked inside FIPS 140-2 Level 3 hardware security modules.
   * Server signs transactions via KMS API calls; private keys NEVER enter application memory or network traffic.
2. **Multi-Party Computation (MPC)**:
   * Institutional key shares are distributed across independent security nodes (e.g. Fireblocks, Web3Auth, Fordefi).
3. **Account Abstraction (ERC-4337) & Delegated Relayers**:
   * Smart Contract Wallets execute transactions sponsored by paymasters, completely eliminating gas fee UX friction.
4. **Multisig / Timelock Governance**:
   * High-value institutional administrative actions require multi-signature approval from designated registrar keys.

---

## 📡 API Endpoints

### Authentication
| Method | Route | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates issuer/admin and returns signed JWT token. | `application/json`: `{ "username": "admin", "password": "..." }` |

### Certificates & Managed Blockchain Signing
| Method | Route | Access | Description | Request Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/certificates/issue` | **Protected (JWT)** | Signs transaction on-chain via institution wallet, saves metadata off-chain, returns receipt & QR. | `multipart/form-data`: `institutionId`, `certificateId`, `studentName`, `courseName`, `pdf` (file), `expiryTimestamp` (optional) |
| `POST` | `/api/certificates/revoke` | **Protected (JWT)** | Signs and submits on-chain revocation transaction via institution wallet. | `application/json`: `{ "institutionId": "...", "certificateId": "..." }` |
| `POST` | `/api/certificates/version` | **Protected (JWT)** | Signs new version transaction on-chain via institution wallet. | `multipart/form-data`: `institutionId`, `certificateId`, `pdf` (file), `newExpiryTimestamp` (optional) |
| `POST` | `/api/certificates/verify` | **Public** | Auto-detects credential ID from embedded QR code (or optional `certificateId`), hashes uploaded PDF, and verifies cryptographic status against blockchain. Logs attempt to SQLite `verification_logs`. | `multipart/form-data`: `pdf` (file, required), `certificateId` (optional) |
| `GET` | `/api/certificates/:id` | **Public** | Retrieves off-chain certificate metadata. | URL parameter: `id` |
| `GET` | `/api/audit/events` | **Protected (JWT)** | Unified Audit Trail: Combines on-chain lifecycle events (`Source: Blockchain`) and application verification activity (`Source: Application Verification Log`). | Query params: `page`, `limit`, `eventType`, `source` (`ALL`, `blockchain`, `application`), `search` |

---

## 🔍 Public Verification & Unified Audit Architecture

### PDF Verification & QR Auto-Detection Flow
1. **Public Verifier Uploads PDF**: Uploads candidate certificate PDF.
2. **Credential ID Auto-Detection**: Backend scans the PDF stream for embedded verification QR URL parameters (`id=<certId>`) or certificate ID text patterns.
3. **Manual Fallback**: If the credential ID cannot be auto-detected, the verifier is prompted to provide the Credential ID manually.
4. **Cryptographic SHA-256 Hashing**: PDF bytes are hashed using SHA-256.
5. **On-Chain Smart Contract Lookup**: `DigitalCredential.verifyCertificate(certificateId, hash)` executes read-only on the blockchain.
6. **Result Returned**: Returns status (`VALID`, `TAMPERED`, `REVOKED`, `EXPIRED`, `NOT_FOUND`). Blockchain remains 100% authoritative.
7. **Application Verification Logged**: Attempt is recorded in SQLite `verification_logs` with timestamp, result, IP address, and user agent.

### Unified Audit Trail Design
* **Blockchain Events (`Source: Blockchain`)**: State-changing lifecycle operations (`CertificateIssued`, `CertificateRevoked`, `CertificateVersionCreated`) with block numbers and transaction hashes.
* **Application Logs (`Source: Application Verification Log`)**: Non-state-changing read verification attempts logged in SQLite with status, timestamp, IP address, and user agent.
* **Separation of Concerns**: Verification logs are explicitly marked as application read operations and NEVER fabricated as fake blockchain transactions.

---

## 🔒 Security Threat Model

| Threat | Mitigated By | Mechanism |
| :--- | :--- | :--- |
| **Unauthorized Institution Issuance** | Smart Contract | `isAuthorizedIssuer(institutionId, msg.sender)` check on-chain. |
| **Tampered PDF Document** | Cryptographic Hash | SHA-256 hash computed from PDF bytes fails on-chain verification check. |
| **Database Compromise** | Blockchain Authority | SQLite cannot alter or forge on-chain certificate validity or hash. |
| **Private Key Exposure** | Server Signer Isolation | Private keys are server-side only; NEVER sent to browser JS, localStorage, or `VITE_*` env. |
| **QR Code Forgery** | URL + Hash Verify | QR code contains only public URL and ID; verification re-hashes uploaded document against smart contract. |
