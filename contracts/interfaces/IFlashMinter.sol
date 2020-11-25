// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IFlashMinter {
    function executeOnFlashMint(bytes calldata data) external;
}
