import {
  defaultAbiCoder,
  hexlify,
  keccak256,
  toUtf8Bytes,
} from "ethers/lib/utils";
import { expect, use, util } from "chai";
import { BigNumber, Contract } from "ethers";
import { utils } from "ethers";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import BasicToken from "../artifacts/FlashToken.json";
import { Wallet } from "ethers";
import BN from "bn.js";
import { constants } from "ethers";
import { ecsign } from "ethereumjs-util";
import { ethers } from "@nomiclabs/buidler";

use(solidity);

describe("Flash token", async function () {
  let FlashToken: any;
  let accounts: any;
  let token: any;
  const [wallet, walletTo] = new MockProvider().getWallets();

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  const AMOUNT: any = 50;
  const EIP712DOMAIN_HASH: any =
    "0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f";
  const NAME_HASH: any =
    "0x345b72c36b14f1cee01efb8ac4b299dc7b8d873e28b4796034548a3d371a4d2f";
  const VERSION_HASH: any =
    "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6";

  beforeEach(async function () {
    FlashToken = await deployContract(wallet, BasicToken, [wallet.address]);
    // token = await ethers.getContractFactory("FlashToken");
    // accounts = await ethers.getSigners();
    // FlashToken = await token.deploy(wallet.address);
    // await FlashToken.deployed();
  });
  it("name", async () => {
    const name = await FlashToken.name();
    expect(name).to.be.equal("Flash Token");
  });
  it("symbol", async () => {
    expect(await FlashToken.symbol()).to.be.equal("FLASH");
  });

  it("decimals", async () => {
    expect(await FlashToken.decimals()).to.be.equal(18);
  });

  it("name hash", async () => {
    expect(keccak256(toUtf8Bytes("FLASH"))).to.be.equal(
      "0x345b72c36b14f1cee01efb8ac4b299dc7b8d873e28b4796034548a3d371a4d2f"
    );
  });

  it("version hash", async () => {
    expect(keccak256(toUtf8Bytes("1"))).to.be.equal(
      "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"
    );
  });

  it("Domain Seperator", async () => {
    expect(await FlashToken.getDomainSeparator()).to.be.equal(
      keccak256(
        defaultAbiCoder.encode(
          ["bytes32", "bytes32", "bytes32", "uint256", "address"],
          [
            EIP712DOMAIN_HASH,
            NAME_HASH,
            VERSION_HASH,
            await FlashToken.getChainId(),
            FlashToken.address,
          ]
        )
      )
    );
  });
  it("approve", async () => {
    await expect(FlashToken.approve(walletTo.address, AMOUNT))
      .to.emit(FlashToken, "Approval")
      .withArgs(wallet.address, walletTo.address, AMOUNT);
    expect(
      await FlashToken.allowance(wallet.address, walletTo.address)
    ).to.equal(AMOUNT);
  });
  it("mint", async () => {
    await expect(FlashToken.mint(walletTo.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(ZERO_ADDRESS, walletTo.address, AMOUNT);
    expect(await FlashToken.balanceOf(walletTo.address)).to.equal(
      (await FlashToken.totalSupply()).add(new BN(AMOUNT))
    );
  });
  it("transfer", async () => {
    await expect(FlashToken.mint(wallet.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(ZERO_ADDRESS, wallet.address, AMOUNT);
    expect(await FlashToken.balanceOf(wallet.address)).to.equal(
      (await FlashToken.totalSupply()).add(new BN(AMOUNT))
    );
    await expect(FlashToken.transfer(walletTo.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(wallet.address, walletTo.address, AMOUNT);
    expect(await FlashToken.balanceOf(walletTo.address)).to.equal(AMOUNT);
    const Another = FlashToken.connect(walletTo);
    await expect(Another.transfer(wallet.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(walletTo.address, wallet.address, AMOUNT);
    expect(await FlashToken.balanceOf(wallet.address)).to.equal(AMOUNT);
  });
  it("transfer", async () => {
    await expect(FlashToken.mint(wallet.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(ZERO_ADDRESS, wallet.address, AMOUNT);
    expect(await FlashToken.balanceOf(wallet.address)).to.equal(
      (await FlashToken.totalSupply()).add(new BN(AMOUNT))
    );
    await expect(FlashToken.transfer(walletTo.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(wallet.address, walletTo.address, AMOUNT);
    expect(await FlashToken.balanceOf(walletTo.address)).to.equal(AMOUNT);
  });
  it("transfer:fail", async () => {
    await expect(FlashToken.transfer(walletTo.address, 1)).to.be.revertedWith(
      "MATH:SUB_UNDERFLOW"
    );
  });
  it("transferFrom", async () => {
    await expect(FlashToken.mint(wallet.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(ZERO_ADDRESS, wallet.address, AMOUNT);
    expect(await FlashToken.balanceOf(wallet.address)).to.equal(
      (await FlashToken.totalSupply()).add(new BN(AMOUNT))
    );
    await FlashToken.approve(walletTo.address, AMOUNT);
    const Another = FlashToken.connect(walletTo);
    await expect(Another.transferFrom(wallet.address, walletTo.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(wallet.address, walletTo.address, AMOUNT);
    expect(
      await FlashToken.allowance(wallet.address, walletTo.address)
    ).to.equal(0);
    expect(await FlashToken.balanceOf(wallet.address)).to.equal(0);
    expect(await FlashToken.balanceOf(walletTo.address)).to.equal(AMOUNT);
  });
  // it("permit", async () => {
  //   await expect(FlashToken.mint(wallet.address, AMOUNT))
  //     .to.emit(FlashToken, "Transfer")
  //     .withArgs(ZERO_ADDRESS, wallet.address, AMOUNT);
  //   expect(await FlashToken.balanceOf(wallet.address)).to.equal(
  //     (await FlashToken.totalSupply()).add(new BN(AMOUNT))
  //   );
  //   const deadline: any = constants.MaxUint256;
  //   const nonces = await FlashToken.nonces(wallet.address);
  //   const encodeData: any = keccak256(
  //     defaultAbiCoder.encode(
  //       ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
  //       [
  //         await FlashToken.PERMIT_TYPEHASH(),
  //         wallet.address,
  //         walletTo.address,
  //         AMOUNT,
  //         nonces,
  //         deadline,
  //       ]
  //     )
  //   );
  //   const digest: any = keccak256(
  //     defaultAbiCoder.encode(
  //       ["bytes1", "bytes1", "bytes32", "bytes32"],
  //       ["0x19", "0x01", , await FlashToken.getDomainSeparator(), encodeData]
  //     )
  //   );
  //   const { v, r, s } = ecsign(
  //     Buffer.from(digest.slice(2), "hex"),
  //     Buffer.from(wallet.privateKey.slice(2), "hex")
  //   );
  //   await expect(
  //     FlashToken.permit(
  //       wallet.address,
  //       walletTo.address,
  //       AMOUNT,
  //       deadline,
  //       v,
  //       hexlify(r),
  //       hexlify(s)
  //     )
  //   ).to.emit(FlashToken, "Approval");
  //   expect(
  //     await FlashToken.allowance(wallet.address, walletTo.address)
  //   ).to.equal(AMOUNT);
  //   expect(await FlashToken.nonces(wallet.address)).to.equal(1);
  // });
});
