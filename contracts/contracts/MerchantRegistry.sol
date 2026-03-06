// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CitychainAccess.sol";

contract MerchantRegistry is CitychainAccess {
    mapping(address => bool) public isMerchant;
    uint256 public merchantCount;

    event MerchantAdded(address indexed merchant);
    event MerchantRemoved(address indexed merchant);

    constructor(address initialAdmin) CitychainAccess(initialAdmin) {}

    function addMerchant(address merchant) external onlyAdmin {
        require(merchant != address(0), "merchant_registry:zero_address");
        require(!isMerchant[merchant], "merchant_registry:exists");

        isMerchant[merchant] = true;
        merchantCount += 1;
        emit MerchantAdded(merchant);
    }

    function removeMerchant(address merchant) external onlyAdmin {
        require(isMerchant[merchant], "merchant_registry:not_found");

        isMerchant[merchant] = false;
        merchantCount -= 1;
        emit MerchantRemoved(merchant);
    }
}
