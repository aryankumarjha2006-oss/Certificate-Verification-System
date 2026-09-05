// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstitutionRegistry.sol";

/**
 * @title CertificateRegistry
 * @dev Manages the lifecycle of digital certificates.
 * Designed to be called by the DigitalCredential facade.
 */
contract CertificateRegistry {
    
    enum CertificateStatus { ACTIVE, REVOKED }

    struct Certificate {
        string certificateId;
        string certificateHash;
        address issuer;
        uint256 issueTimestamp;
        uint256 expiryTimestamp;
        CertificateStatus status;
        uint256 version;
        bool exists;
    }

    mapping(string => Certificate) private certificates;
    InstitutionRegistry public institutionRegistry;
    address public facadeAddress;

    event CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version);
    event CertificateRevoked(string indexed certificateId);
    event CertificateVersionCreated(string indexed certificateId, string newCertificateHash, uint256 newExpiryTimestamp, uint256 newVersion);

    error CertificateAlreadyExists();
    error CertificateDoesNotExist();
    error CertificateAlreadyRevoked();
    error InvalidCertificateData();
    error UnauthorizedIssuer();
    error OnlyFacadeAllowed();

    modifier onlyFacade() {
        if (msg.sender != facadeAddress && facadeAddress != address(0)) revert OnlyFacadeAllowed();
        _;
    }

    constructor(address _institutionRegistry) {
        institutionRegistry = InstitutionRegistry(_institutionRegistry);
        facadeAddress = msg.sender; // initially deployer
    }

    function setFacadeAddress(address _facadeAddress) external {
        if (msg.sender != facadeAddress && facadeAddress != address(0)) revert OnlyFacadeAllowed();
        facadeAddress = _facadeAddress;
    }

    function issueCertificate(
        address _caller,
        string memory _institutionId,
        string memory _certificateId,
        string memory _certificateHash,
        uint256 _expiryTimestamp
    ) external onlyFacade {
        if (!institutionRegistry.isAuthorizedIssuer(_institutionId, _caller)) revert UnauthorizedIssuer();
        if (bytes(_certificateId).length == 0 || bytes(_certificateHash).length == 0) revert InvalidCertificateData();
        if (certificates[_certificateId].exists) revert CertificateAlreadyExists();

        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            certificateHash: _certificateHash,
            issuer: _caller,
            issueTimestamp: block.timestamp,
            expiryTimestamp: _expiryTimestamp,
            status: CertificateStatus.ACTIVE,
            version: 1,
            exists: true
        });

        emit CertificateIssued(_certificateId, _certificateHash, _caller, _expiryTimestamp, 1);
    }

    function getCertificate(string memory _certificateId) external view returns (Certificate memory) {
        if (!certificates[_certificateId].exists) revert CertificateDoesNotExist();
        return certificates[_certificateId];
    }

    function verifyCertificate(string memory _certificateId, string memory _certificateHash) external view returns (string memory) {
        if (!certificates[_certificateId].exists) return "NOT_FOUND";
        
        Certificate memory cert = certificates[_certificateId];
        
        if (keccak256(bytes(cert.certificateHash)) != keccak256(bytes(_certificateHash))) return "TAMPERED";
        if (cert.status == CertificateStatus.REVOKED) return "REVOKED";
        if (cert.expiryTimestamp > 0 && block.timestamp > cert.expiryTimestamp) return "EXPIRED";
        
        return "VALID";
    }

    function revokeCertificate(address _caller, string memory _institutionId, string memory _certificateId) external onlyFacade {
        if (!certificates[_certificateId].exists) revert CertificateDoesNotExist();
        
        bool isAuthorized = (_caller == certificates[_certificateId].issuer) || institutionRegistry.isAuthorizedIssuer(_institutionId, _caller);
        
        InstitutionRegistry.Institution memory inst;
        try institutionRegistry.getInstitution(_institutionId) returns (InstitutionRegistry.Institution memory _inst) {
            inst = _inst;
        } catch {
            revert("Institution error");
        }
        
        bool isAuthority = (_caller == inst.wallet);

        if (!isAuthorized && !isAuthority) revert UnauthorizedIssuer();
        if (certificates[_certificateId].status == CertificateStatus.REVOKED) revert CertificateAlreadyRevoked();

        certificates[_certificateId].status = CertificateStatus.REVOKED;

        emit CertificateRevoked(_certificateId);
    }

    function createNewVersion(
        address _caller,
        string memory _institutionId,
        string memory _certificateId,
        string memory _newCertificateHash,
        uint256 _newExpiryTimestamp
    ) external onlyFacade {
        if (!certificates[_certificateId].exists) revert CertificateDoesNotExist();
        if (!institutionRegistry.isAuthorizedIssuer(_institutionId, _caller)) revert UnauthorizedIssuer();
        if (bytes(_newCertificateHash).length == 0) revert InvalidCertificateData();

        Certificate storage cert = certificates[_certificateId];
        cert.certificateHash = _newCertificateHash;
        cert.expiryTimestamp = _newExpiryTimestamp;
        cert.version += 1;
        cert.issueTimestamp = block.timestamp;

        emit CertificateVersionCreated(_certificateId, _newCertificateHash, _newExpiryTimestamp, cert.version);
    }
}
