// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CitychainAccess.sol";

contract RewardsToken is CitychainAccess {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address initialAdmin
    ) CitychainAccess(initialAdmin) {
        name = tokenName;
        symbol = tokenSymbol;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "rewards_token:zero_to");
        require(balanceOf[msg.sender] >= value, "rewards_token:insufficient_balance");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyAdmin returns (bool) {
        require(to != address(0), "rewards_token:zero_to");
        require(value > 0, "rewards_token:zero_amount");

        totalSupply += value;
        balanceOf[to] += value;

        emit Mint(to, value);
        emit Transfer(address(0), to, value);
        return true;
    }

    function burnFrom(address from, uint256 value) external onlyAdmin returns (bool) {
        require(from != address(0), "rewards_token:zero_from");
        require(balanceOf[from] >= value, "rewards_token:insufficient_balance");

        balanceOf[from] -= value;
        totalSupply -= value;

        emit Burn(from, value);
        emit Transfer(from, address(0), value);
        return true;
    }
}
