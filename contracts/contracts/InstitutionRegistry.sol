// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CitychainAccess.sol";

contract InstitutionRegistry is CitychainAccess {
    mapping(address => bool) public isInstitution;
    uint256 public institutionCount;

    event InstitutionAdded(address indexed institution);
    event InstitutionRemoved(address indexed institution);

    constructor(address initialAdmin) CitychainAccess(initialAdmin) {}

    function addInstitution(address institution) external onlyAdmin {
        require(institution != address(0), "institution_registry:zero_address");
        require(!isInstitution[institution], "institution_registry:exists");

        isInstitution[institution] = true;
        institutionCount += 1;
        emit InstitutionAdded(institution);
    }

    function removeInstitution(address institution) external onlyAdmin {
        require(isInstitution[institution], "institution_registry:not_found");

        isInstitution[institution] = false;
        institutionCount -= 1;
        emit InstitutionRemoved(institution);
    }
}
