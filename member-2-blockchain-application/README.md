# Member 2: Blockchain Application & Verification Layer

This directory contains the off-chain application, REST backend, frontend verification portal, and Ethers.js blockchain integration for the Blockchain Certificate Verification System.

---

## 🏛️ Architecture Overview

The system is built on a clean separation between **on-chain trust anchor** and **off-chain privacy & presentation**:

* **On-Chain (Member 1 Core):** Immutable certificate IDs, SHA-256 document digests, issuer addresses, issuance timestamps, expiry timestamps, versions, and revocation states.
* **Off-Chain (Member 2 Application):** PDF document handling, SHA-256 hash computation, student/course metadata in SQLite, QR verification URL generation, and background event synchronization.

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18+ recommended)
* Running local Hardhat node from `member-1-blockchain-core` (`npx hardhat node`)
* Deployed smart contracts (`npx hardhat run scripts/deploy.js --network localhost`)

### 2. Environment Configuration
Create a `.env` file in this directory (or use `.env.example`):
```env
PORT=3000
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
INSTITUTION_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
CERTIFICATE_REGISTRY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
DIGITAL_CREDENTIAL_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
JWT_SECRET=your_jwt_secret_here
```

### 3. Install Dependencies & Start Server
```bash
npm install
npm start
```
The server will start on `http://localhost:3000`.

---

## 📡 API Endpoints

| Method | Route | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/certificates/issue` | Issues certificate on-chain, saves metadata off-chain, returns QR code. | `multipart/form-data`: `institutionId`, `certificateId`, `studentName`, `courseName`, `pdf` (file), `expiryTimestamp` (optional) |
| `POST` | `/api/certificates/verify` | Hashes uploaded PDF and verifies cryptographic status against blockchain. | `multipart/form-data`: `certificateId`, `pdf` (file) |
| `POST` | `/api/certificates/revoke` | Submits on-chain revocation transaction. | `application/json`: `{ "institutionId": "...", "certificateId": "..." }` |
| `POST` | `/api/certificates/version` | Updates certificate hash & increments version on-chain. | `multipart/form-data`: `institutionId`, `certificateId`, `pdf` (file), `newExpiryTimestamp` (optional) |
| `GET` | `/api/certificates/:id` | Retrieves off-chain certificate metadata. | URL parameter: `id` |

---

## 🖥️ Frontend Portals

1. **Institution Dashboard (`/index.html`)**: Allows authorized institution issuers to issue new digital certificates with PDF uploads, metadata capture, and instant QR code generation.
2. **Public Verification Portal (`/verify.html`)**: QR code target page. Anyone can submit a certificate PDF to verify its authenticity against the smart contract. Clearly indicates `VALID`, `TAMPERED`, `REVOKED`, `EXPIRED`, or `NOT_FOUND` statuses.

---

## 🔒 Security & Data Integrity

* **Zero PII on Blockchain:** Only SHA-256 cryptographic hashes are submitted to smart contracts.
* **Tamper Evident:** Comparing the hash of an uploaded file against the smart contract immediately identifies any tampering.
* **Dynamic Event Synchronization:** Ethers.js background listeners capture `CertificateRevoked` and state change events to synchronize the SQLite database automatically.
* **Environment Protection:** Secrets, keys, and SQLite database files are excluded from Git via `.gitignore`.
