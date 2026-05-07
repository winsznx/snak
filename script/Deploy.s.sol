// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../contracts/Snak.sol";

// Deploy Snak.
//
// env:
//   PRIVATE_KEY      — deployer
//   CUSD_ADDRESS     — cUSD on the target chain
//   TREASURY_ADDRESS — collects 5% of every settled pot + 20% of forfeit stakes
//   SCORER_ADDRESS   — server key allowed to submit scores in v1
//   BADGE_BASE_URI   — optional metadata gateway
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address cUSDAddress = vm.envAddress("CUSD_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address scorer = vm.envAddress("SCORER_ADDRESS");
        string memory baseURI = vm.envOr("BADGE_BASE_URI", string(""));

        vm.startBroadcast(pk);

        Snak snak = new Snak(IERC20(cUSDAddress), treasury, scorer);

        if (bytes(baseURI).length > 0) {
            snak.setBaseURI(baseURI);
        }

        vm.stopBroadcast();

        console2.log("Snak:", address(snak));
        console2.log("cUSD:", cUSDAddress);
        console2.log("treasury:", treasury);
        console2.log("scorer:", scorer);
    }
}
