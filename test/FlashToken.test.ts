const { defaultAbiCoder, keccak256, toUtf8Bytes } = require("ethers/lib/utils");
import {expect, use} from 'chai';
import {Contract} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import FlashToken from '../artifacts/FlashToken.json';

use(solidity)

describe("Flash token", async function () {
  const [wallet, walletTo] = new MockProvider().getWallets();
  let token: Contract;

  beforeEach(async () => {
    token = await deployContract(wallet, FlashToken, [wallet.address]);
    console.log(token.address)
  });

  it('Assigns initial balance', async () => {
    expect(await token.balanceOf(wallet.address)).to.equal(0);
  });
});