# Blockchain Data

This document explains what data is stored on-chain in the smart contracts versus what data should be kept off-chain by the application (Member 2).

## What is Stored On-Chain

The blockchain is used exclusively as an immutable registry for verifiable proofs, not for bulk data storage.

### Institution Registry Data
- **`id`**: Unique string identifier (e.g., "UNIV01").
- **`name`**: Institution's name as a string.
- **`wallet`**: The Ethereum address of the institution's main authority.
- **`isActive`**: Boolean flag indicating if the institution can authorize new issuers.
- **`authorizedIssuers`**: A mapping tracking which Ethereum addresses are authorized to issue certificates on behalf of an institution.

### Certificate Registry Data
- **`certificateId`**: Unique string identifier (e.g., "CERT-2026-001").
- **`certificateHash`**: A cryptographic hash (e.g., SHA-256) of the actual certificate document.
- **`issuer`**: The Ethereum address that issued the certificate.
- **`issueTimestamp`**: Unix timestamp when the certificate was issued.
- **`expiryTimestamp`**: Unix timestamp for expiration (or `0` if it never expires).
- **`status`**: State of the certificate (`ACTIVE` or `REVOKED`).
- **`version`**: Integer tracking the version number of the certificate (starts at `1`).

## What is Stored Off-Chain

To maintain privacy, comply with data regulations (like GDPR), and save gas costs, the following data MUST be stored off-chain (e.g., in IPFS, a traditional database, or cloud storage):

- **Certificate Documents**: The actual PDF or digital file of the certificate.
- **Student PII**: Personal Identifiable Information (Name, Date of Birth, Email, Grades).
- **User Accounts**: Non-blockchain user credentials, roles, and profiles.
- **Verification Logs**: Audit logs of who verified a certificate and when.
- **Application Metadata**: UI configurations, formatting, etc.
- **Large Files**: Any large binary blobs or documents.
