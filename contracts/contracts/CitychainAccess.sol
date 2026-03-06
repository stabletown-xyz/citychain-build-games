// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CitychainAccess {
    address public admin;

    event AdminTransferred(address indexed previousAdmin, address indexed nextAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "citychain_access:not_admin");
        _;
    }

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "citychain_access:zero_admin");
        admin = initialAdmin;
    }

    function transferAdmin(address nextAdmin) external onlyAdmin {
        require(nextAdmin != address(0), "citychain_access:zero_admin");
        address previous = admin;
        admin = nextAdmin;
        emit AdminTransferred(previous, nextAdmin);
    }
}
