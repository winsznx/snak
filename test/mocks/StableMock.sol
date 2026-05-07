// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@oz/token/ERC20/ERC20.sol";

contract StableMock is ERC20 {
    constructor() ERC20("Stable Mock", "STBL") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
