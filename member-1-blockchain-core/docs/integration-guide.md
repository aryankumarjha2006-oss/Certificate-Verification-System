# Integration Guide (For Member 2)

This guide provides instructions on how to integrate the backend application with the deployed smart contracts.

## 1. Contract Addresses

After deploying the contracts locally, you will receive three addresses (see the terminal output from `npx hardhat run scripts/deploy.js --network localhost`). Save these addresses in your backend `.env` file.

- `InstitutionRegistry Address`
- `CertificateRegistry Address`
- `DigitalCredential Address`

## 2. ABI Location

The ABIs (Application Binary Interfaces) are generated upon compilation and are required for ethers.js to interact with the contracts.
You can find them in:
- `member-1-blockchain-core/artifacts/contracts/InstitutionRegistry.sol/InstitutionRegistry.json`
- `member-1-blockchain-core/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json`
- `member-1-blockchain-core/artifacts/contracts/DigitalCredential.sol/DigitalCredential.json`

## 3. Connecting to the Blockchain

Use `ethers.js` in your Node.js backend to connect to the local Hardhat node:

```javascript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Load ABIs
const digitalCredentialAbi = [ /* ... from JSON ... */ ];
const digitalCredential = new ethers.Contract(DIGITAL_CREDENTIAL_ADDRESS, digitalCredentialAbi, signer);

// For events, you may also need to connect to the specific registries:
const certRegistryAbi = [ /* ... from JSON ... */ ];
const certRegistry = new ethers.Contract(CERT_REGISTRY_ADDRESS, certRegistryAbi, signer);
```

## 4. How to call `issueCertificate()`

**Caller**: Must be an authorized issuer.
```javascript
const institutionId = "UNIV01";
const certificateId = "CERT123";
const documentHash = "0x..."; // SHA-256 hash of the PDF
const expiryTimestamp = 0; // 0 for no expiry

const tx = await digitalCredential.issueCertificate(institutionId, certificateId, documentHash, expiryTimestamp);
await tx.wait(); // Wait for confirmation
```

## 5. How to call `getCertificate()`

**Caller**: Anyone (Read-only).
```javascript
const certData = await digitalCredential.getCertificate("CERT123");
console.log(certData.certificateHash, certData.status, certData.version);
```

## 6. How to verify a hash

**Caller**: Anyone (Read-only).
```javascript
const documentHash = "0x..."; // SHA-256 hash of the uploaded PDF
const statusString = await digitalCredential.verifyCertificate("CERT123", documentHash);
// Expected returns: "VALID", "TAMPERED", "REVOKED", "EXPIRED", "NOT_FOUND"
```

## 7. How to revoke

**Caller**: Original issuer or institution wallet.
```javascript
const tx = await digitalCredential.revokeCertificate("UNIV01", "CERT123");
await tx.wait();
```

## 8. How to create a new version

**Caller**: Authorized issuer.
```javascript
const newDocumentHash = "0x..."; // Hash of the corrected PDF
const newExpiry = 0;

const tx = await digitalCredential.createNewVersion("UNIV01", "CERT123", newDocumentHash, newExpiry);
await tx.wait();
```

## 9. Listening for Events

You can listen for events to update your off-chain database automatically:
```javascript
certRegistry.on("CertificateIssued", (certId, hash, issuer, expiry, version, event) => {
    console.log(`New certificate issued: ${certId} by ${issuer}`);
});
```

## 10. Expected Verification Results

The `verifyCertificate` function strictly returns one of these strings:
- **`VALID`**: The hash matches, it is not revoked, and it is not expired.
- **`TAMPERED`**: The certificate exists, but the provided hash does not match the on-chain hash.
- **`REVOKED`**: The certificate was explicitly revoked by the issuer/institution.
- **`EXPIRED`**: The current block timestamp is past the certificate's `expiryTimestamp`.
- **`NOT_FOUND`**: No certificate with the given ID exists.
