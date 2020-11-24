// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../interfaces/tests/IFlashMint.sol";
import "../interfaces/IFlashMinter.sol";
import "../interfaces/IERC20.sol";

contract FlashMinter is IFlashMinter {

    address FLASH_CONTRACT;

    constructor(address _token) public{
        FLASH_CONTRACT = _token;
    }

    function flashMint(uint256 _value, bytes calldata _data) public {
        IFlashMint(FLASH_CONTRACT).flashMint(_value,_data);
    }

    function executeOnFlashMint(bytes calldata data) public override {
         (bool flag, uint256 value,address sender) = abi.decode(data, (bool, uint256,address));
         
         if(flag){
             IERC20(FLASH_CONTRACT).transfer(sender,value);
         }
    }
}
