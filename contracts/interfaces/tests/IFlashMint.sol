// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IFlashMint {
    function flashMint(uint256 value,bytes calldata data) external;
}
