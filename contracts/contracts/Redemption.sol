// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CitychainAccess.sol";

interface IRewardsToken {
    function burnFrom(address from, uint256 value) external returns (bool);
}

interface IMerchantRegistry {
    function isMerchant(address merchant) external view returns (bool);
}

contract Redemption is CitychainAccess {
    IRewardsToken public immutable rewardsToken;
    IMerchantRegistry public immutable merchantRegistry;

    event Redeemed(
        address indexed participant,
        address indexed merchant,
        uint256 amount,
        string settlementReference
    );

    constructor(
        address initialAdmin,
        address rewardsTokenAddress,
        address merchantRegistryAddress
    ) CitychainAccess(initialAdmin) {
        require(rewardsTokenAddress != address(0), "redemption:zero_token");
        require(merchantRegistryAddress != address(0), "redemption:zero_registry");
        rewardsToken = IRewardsToken(rewardsTokenAddress);
        merchantRegistry = IMerchantRegistry(merchantRegistryAddress);
    }

    function redeem(
        address participant,
        address merchant,
        uint256 amount,
        string calldata settlementReference
    ) external onlyAdmin returns (bool) {
        require(participant != address(0), "redemption:zero_participant");
        require(merchant != address(0), "redemption:zero_merchant");
        require(amount > 0, "redemption:zero_amount");
        require(merchantRegistry.isMerchant(merchant), "redemption:merchant_not_allowed");

        rewardsToken.burnFrom(participant, amount);
        emit Redeemed(participant, merchant, amount, settlementReference);
        return true;
    }
}
