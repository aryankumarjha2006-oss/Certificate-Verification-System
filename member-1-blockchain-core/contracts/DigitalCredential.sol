// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstitutionRegistry.sol";
import "./CertificateRegistry.sol";

/**
 * @title DigitalCredential
 * @dev Main integration contract for the Digital Credential Platform.
 * Provides a unified interface for Member 2's application.
 */
contract DigitalCredential {
    
    InstitutionRegistry public institutionRegistry;
    CertificateRegistry public certificateRegistry;

    constructor(address _institutionRegistry, address _certificateRegistry) {
        institutionRegistry = InstitutionRegistry(_institutionRegistry);
        certificateRegistry = CertificateRegistry(_certificateRegistry);
    }

    // --- Institution Operations (Read-Only) ---

    function getInstitution(string memory _id) external view returns (InstitutionRegistry.Institution memory) {
        return institutionRegistry.getInstitution(_id);
    }

    function isAuthorizedIssuer(string memory _institutionId, address _issuer) external view returns (bool) {
        return institutionRegistry.isAuthorizedIssuer(_institutionId, _issuer);
    }

    function isInstitutionActive(string memory _id) external view returns (bool) {
        return institutionRegistry.isInstitutionActive(_id);
    }

    // --- Certificate Operations (Write & Read) ---

    function issueCertificate(
        string memory _institutionId,
        string memory _certificateId,
        string memory _certificateHash,
        uint256 _expiryTimestamp
    ) external {
        certificateRegistry.issueCertificate(msg.sender, _institutionId, _certificateId, _certificateHash, _expiryTimestamp);
    }

    function getCertificate(string memory _certificateId) external view returns (CertificateRegistry.Certificate memory) {
        return certificateRegistry.getCertificate(_certificateId);
    }

    function verifyCertificate(string memory _certificateId, string memory _certificateHash) external view returns (string memory) {
        return certificateRegistry.verifyCertificate(_certificateId, _certificateHash);
    }

    function revokeCertificate(string memory _institutionId, string memory _certificateId) external {
        certificateRegistry.revokeCertificate(msg.sender, _institutionId, _certificateId);
    }

    function createNewVersion(
        string memory _institutionId,
        string memory _certificateId,
        string memory _newCertificateHash,
        uint256 _newExpiryTimestamp
    ) external {
        certificateRegistry.createNewVersion(msg.sender, _institutionId, _certificateId, _newCertificateHash, _newExpiryTimestamp);
    }
}
