// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InstitutionRegistry
 * @dev Manages institutions and their authorized issuers.
 */
contract InstitutionRegistry is Ownable {
    
    struct Institution {
        string id;
        string name;
        address wallet;
        bool isActive;
        bool exists;
    }

    // Mapping from institution ID to Institution
    mapping(string => Institution) private institutions;
    
    // Mapping from institution ID to a mapping of authorized issuer addresses
    mapping(string => mapping(address => bool)) private authorizedIssuers;

    event InstitutionRegistered(string indexed id, string name, address indexed wallet);
    event InstitutionDeactivated(string indexed id);
    event IssuerAuthorized(string indexed institutionId, address indexed issuer);
    event IssuerRevoked(string indexed institutionId, address indexed issuer);

    error InstitutionAlreadyExists();
    error InvalidInstitutionData();
    error InstitutionDoesNotExist();
    error InstitutionInactive();
    error UnauthorizedCaller();
    error InvalidIssuerAddress();

    /**
     * @dev Sets the deployer as the initial platform administrator (owner).
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registers a new institution. Only callable by platform admin.
     * @param _id Unique identifier for the institution.
     * @param _name Name of the institution.
     * @param _wallet Authorized wallet address for the institution.
     */
    function registerInstitution(string memory _id, string memory _name, address _wallet) external onlyOwner {
        if (bytes(_id).length == 0 || bytes(_name).length == 0 || _wallet == address(0)) revert InvalidInstitutionData();
        if (institutions[_id].exists) revert InstitutionAlreadyExists();

        institutions[_id] = Institution({
            id: _id,
            name: _name,
            wallet: _wallet,
            isActive: true,
            exists: true
        });

        emit InstitutionRegistered(_id, _name, _wallet);
    }

    /**
     * @dev Deactivates an institution. Only callable by platform admin.
     * @param _id Unique identifier for the institution.
     */
    function deactivateInstitution(string memory _id) external onlyOwner {
        if (!institutions[_id].exists) revert InstitutionDoesNotExist();
        
        institutions[_id].isActive = false;
        
        emit InstitutionDeactivated(_id);
    }

    /**
     * @dev Retrieves institution details.
     * @param _id Unique identifier for the institution.
     */
    function getInstitution(string memory _id) external view returns (Institution memory) {
        if (!institutions[_id].exists) revert InstitutionDoesNotExist();
        return institutions[_id];
    }

    /**
     * @dev Checks if an institution is active.
     * @param _id Unique identifier for the institution.
     */
    function isInstitutionActive(string memory _id) external view returns (bool) {
        return institutions[_id].isActive;
    }

    /**
     * @dev Authorizes a new issuer for an institution. Only callable by the institution's wallet.
     * @param _institutionId ID of the institution.
     * @param _issuer Address to be authorized as an issuer.
     */
    function authorizeIssuer(string memory _institutionId, address _issuer) external {
        if (!institutions[_institutionId].exists) revert InstitutionDoesNotExist();
        if (!institutions[_institutionId].isActive) revert InstitutionInactive();
        if (msg.sender != institutions[_institutionId].wallet) revert UnauthorizedCaller();
        if (_issuer == address(0)) revert InvalidIssuerAddress();

        authorizedIssuers[_institutionId][_issuer] = true;

        emit IssuerAuthorized(_institutionId, _issuer);
    }

    /**
     * @dev Revokes an issuer for an institution. Only callable by the institution's wallet.
     * @param _institutionId ID of the institution.
     * @param _issuer Address to be revoked.
     */
    function revokeIssuer(string memory _institutionId, address _issuer) external {
        if (!institutions[_institutionId].exists) revert InstitutionDoesNotExist();
        if (msg.sender != institutions[_institutionId].wallet) revert UnauthorizedCaller();
        
        authorizedIssuers[_institutionId][_issuer] = false;

        emit IssuerRevoked(_institutionId, _issuer);
    }

    /**
     * @dev Checks if an address is an authorized issuer for an active institution.
     * @param _institutionId ID of the institution.
     * @param _issuer Address to check.
     */
    function isAuthorizedIssuer(string memory _institutionId, address _issuer) external view returns (bool) {
        if (!institutions[_institutionId].isActive) return false;
        return authorizedIssuers[_institutionId][_issuer];
    }
}
