# Contract Functions

This document outlines the public and external functions available in the Member 1 smart contracts.

## 1. InstitutionRegistry.sol

### `registerInstitution(string memory _id, string memory _name, address _wallet)`
- **Purpose**: Registers a new educational institution.
- **Parameters**: 
  - `_id`: Unique identifier for the institution.
  - `_name`: Human-readable name.
  - `_wallet`: The institution's authorized wallet address.
- **Caller Requirements**: Must be called by the `PLATFORM ADMIN` (deployer).
- **Return Values**: None.
- **Possible Errors**: `InvalidInstitutionData`, `InstitutionAlreadyExists`, `OwnableUnauthorizedAccount`.

### `deactivateInstitution(string memory _id)`
- **Purpose**: Deactivates an institution so it can no longer authorize issuers.
- **Parameters**: `_id`: Institution ID.
- **Caller Requirements**: Must be called by the `PLATFORM ADMIN`.
- **Return Values**: None.
- **Possible Errors**: `InstitutionDoesNotExist`, `OwnableUnauthorizedAccount`.

### `getInstitution(string memory _id)`
- **Purpose**: Retrieves details of an institution.
- **Parameters**: `_id`: Institution ID.
- **Caller Requirements**: Any.
- **Return Values**: `Institution` struct (id, name, wallet, isActive, exists).
- **Possible Errors**: `InstitutionDoesNotExist`.

### `isInstitutionActive(string memory _id)`
- **Purpose**: Checks if an institution is active.
- **Parameters**: `_id`: Institution ID.
- **Caller Requirements**: Any.
- **Return Values**: `bool` (true if active).
- **Possible Errors**: None.

### `authorizeIssuer(string memory _institutionId, address _issuer)`
- **Purpose**: Authorizes a new issuer for an institution.
- **Parameters**: 
  - `_institutionId`: Institution ID.
  - `_issuer`: Address to authorize.
- **Caller Requirements**: Must be called by the institution's registered `wallet`.
- **Return Values**: None.
- **Possible Errors**: `InstitutionDoesNotExist`, `InstitutionInactive`, `UnauthorizedCaller`, `InvalidIssuerAddress`.

### `revokeIssuer(string memory _institutionId, address _issuer)`
- **Purpose**: Revokes an issuer's authorization.
- **Parameters**:
  - `_institutionId`: Institution ID.
  - `_issuer`: Address to revoke.
- **Caller Requirements**: Must be called by the institution's registered `wallet`.
- **Return Values**: None.
- **Possible Errors**: `InstitutionDoesNotExist`, `UnauthorizedCaller`.

### `isAuthorizedIssuer(string memory _institutionId, address _issuer)`
- **Purpose**: Checks if an address is authorized for an active institution.
- **Parameters**: `_institutionId`, `_issuer`.
- **Caller Requirements**: Any.
- **Return Values**: `bool` (true if authorized and institution is active).
- **Possible Errors**: None.

---

## 2. CertificateRegistry.sol

### `issueCertificate(string memory _institutionId, string memory _certificateId, string memory _certificateHash, uint256 _expiryTimestamp)`
- **Purpose**: Issues a new certificate on the blockchain.
- **Parameters**:
  - `_institutionId`: ID of the issuing institution.
  - `_certificateId`: Unique certificate identifier.
  - `_certificateHash`: Hash of the off-chain certificate document.
  - `_expiryTimestamp`: Unix timestamp for expiry (0 for no expiry).
- **Caller Requirements**: Must be called by an address authorized via `InstitutionRegistry`.
- **Return Values**: None.
- **Possible Errors**: `UnauthorizedIssuer`, `InvalidCertificateData`, `CertificateAlreadyExists`.

### `getCertificate(string memory _certificateId)`
- **Purpose**: Retrieves certificate details.
- **Parameters**: `_certificateId`: Certificate ID.
- **Caller Requirements**: Any.
- **Return Values**: `Certificate` struct (id, hash, issuer, issueTimestamp, expiryTimestamp, status, version).
- **Possible Errors**: `CertificateDoesNotExist`.

### `verifyCertificate(string memory _certificateId, string memory _certificateHash)`
- **Purpose**: Checks if a certificate hash is valid, revoked, expired, or tampered.
- **Parameters**: `_certificateId`, `_certificateHash`.
- **Caller Requirements**: Any.
- **Return Values**: `string` ("VALID", "TAMPERED", "REVOKED", "EXPIRED", "NOT_FOUND").
- **Possible Errors**: None.

### `revokeCertificate(string memory _institutionId, string memory _certificateId)`
- **Purpose**: Revokes a certificate.
- **Parameters**: `_institutionId`, `_certificateId`.
- **Caller Requirements**: Must be called by the original issuer or the institution's wallet.
- **Return Values**: None.
- **Possible Errors**: `CertificateDoesNotExist`, `UnauthorizedIssuer`, `CertificateAlreadyRevoked`.

### `createNewVersion(string memory _institutionId, string memory _certificateId, string memory _newCertificateHash, uint256 _newExpiryTimestamp)`
- **Purpose**: Upgrades a certificate to a new version (new hash).
- **Parameters**:
  - `_institutionId`: Institution ID.
  - `_certificateId`: Certificate ID.
  - `_newCertificateHash`: New document hash.
  - `_newExpiryTimestamp`: New expiry date.
- **Caller Requirements**: Must be called by an authorized issuer.
- **Return Values**: None.
- **Possible Errors**: `CertificateDoesNotExist`, `UnauthorizedIssuer`, `InvalidCertificateData`.

---

## 3. DigitalCredential.sol

This contract provides read-only pass-through functions to simplify the frontend connection, returning data from `InstitutionRegistry`. Write operations should be routed directly to the specific registries.
