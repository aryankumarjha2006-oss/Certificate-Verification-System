# Events

This document details all the events emitted by the Member 1 smart contracts. The frontend (Member 2) should listen to these events to update the UI and index history.

## InstitutionRegistry Events

### `InstitutionRegistered(string indexed id, string name, address indexed wallet)`
- **Emitted When**: The platform admin successfully registers a new institution.
- **Indexed Fields**: `id`, `wallet` (allows searching for institutions by ID or wallet address).
- **Other Fields**: `name`.

### `InstitutionDeactivated(string indexed id)`
- **Emitted When**: The platform admin deactivates an existing institution.
- **Indexed Fields**: `id`.

### `IssuerAuthorized(string indexed institutionId, address indexed issuer)`
- **Emitted When**: An institution wallet authorizes a new address to issue certificates.
- **Indexed Fields**: `institutionId`, `issuer`.

### `IssuerRevoked(string indexed institutionId, address indexed issuer)`
- **Emitted When**: An institution wallet revokes an issuer's authorization.
- **Indexed Fields**: `institutionId`, `issuer`.

---

## CertificateRegistry Events

### `CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version)`
- **Emitted When**: A new certificate is successfully issued.
- **Indexed Fields**: `certificateId`, `issuer`.
- **Other Fields**: `certificateHash` (the hash of the document), `expiryTimestamp` (0 if none), `version` (starts at 1).

### `CertificateRevoked(string indexed certificateId)`
- **Emitted When**: A certificate is revoked by an authorized issuer or institution authority.
- **Indexed Fields**: `certificateId`.

### `CertificateVersionCreated(string indexed certificateId, string newCertificateHash, uint256 newExpiryTimestamp, uint256 newVersion)`
- **Emitted When**: An existing certificate is updated to a new version.
- **Indexed Fields**: `certificateId`.
- **Other Fields**: `newCertificateHash`, `newExpiryTimestamp`, `newVersion` (incremented).
