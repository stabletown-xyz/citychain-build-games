// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CitychainAccess.sol";

contract AttestationVerifier is CitychainAccess {
    mapping(bytes32 => bool) public consumedDigest;
    mapping(uint256 => uint256) public questAttestationCount;

    event AttestationAccepted(
        uint256 indexed questId,
        address indexed participant,
        bytes32 indexed evidenceDigest,
        uint256 attestationIndex
    );

    constructor(address initialAdmin) CitychainAccess(initialAdmin) {}

    function acceptAttestation(
        uint256 questId,
        address participant,
        bytes32 evidenceDigest
    ) external onlyAdmin returns (uint256) {
        require(participant != address(0), "attestation_verifier:zero_participant");
        require(evidenceDigest != bytes32(0), "attestation_verifier:empty_digest");
        require(!consumedDigest[evidenceDigest], "attestation_verifier:digest_replayed");

        consumedDigest[evidenceDigest] = true;
        questAttestationCount[questId] += 1;
        uint256 attestationIndex = questAttestationCount[questId];

        emit AttestationAccepted(questId, participant, evidenceDigest, attestationIndex);
        return attestationIndex;
    }
}
