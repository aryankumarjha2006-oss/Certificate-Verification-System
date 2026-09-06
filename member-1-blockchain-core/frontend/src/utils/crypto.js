import { ethers } from 'ethers';

/**
 * Creates a deterministic, canonical JSON string representing the credential data.
 * All keys are alphabetized and all strings are trimmed to ensure identical hash generation across environments.
 */
export function createCanonicalCredentialPayload(data) {
  return JSON.stringify({
    certificateId: String(data.certificateId || '').trim(),
    expiryDate: String(data.expiryDate || 'Never').trim(),
    institutionId: String(data.institutionId || '').trim(),
    institutionName: String(data.institutionName || '').trim(),
    issueDate: String(data.issueDate || '').trim(),
    purpose: String(data.purpose || '').trim(),
    studentName: String(data.studentName || '').trim()
  });
}

/**
 * Generates a standard SHA-256 cryptographic hash (0x-prefixed hex string)
 * from canonical credential payload.
 */
export function generateCredentialHash(dataOrPayload) {
  const payloadString = typeof dataOrPayload === 'string'
    ? dataOrPayload
    : createCanonicalCredentialPayload(dataOrPayload);

  return ethers.sha256(ethers.toUtf8Bytes(payloadString));
}
