import {
  defaultAbiCoder,
  hexlify,
  keccak256,
  toUtf8Bytes,
  solidityPack
} from "ethers/lib/utils";
import { expect, use } from "chai";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import FlashTokenArtifact from "../artifacts/contracts/FlashToken.sol/FlashToken.json";
import MinterContractArtifact from "../artifacts/contracts/tests/FlashMinter.sol/FlashMinter.json";
import { constants, ethers } from "ethers";
import { ecsign } from "ethereumjs-util";
import { mintTokens } from './utils/functions'

use(solidity);

describe("Flash token", async () => {
  let FlashToken: any;

  const [wallet, walletTo] = new MockProvider().getWallets();

  const EIP712DOMAIN_HASH: any =
    "0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f";
  const NAME_HASH: any =
    "0x345b72c36b14f1cee01efb8ac4b299dc7b8d873e28b4796034548a3d371a4d2f";
  const VERSION_HASH: any =
    "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6";

  beforeEach(async () => {
    FlashToken = await deployContract(wallet, FlashTokenArtifact, [wallet.address, wallet.address]);
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
    await expect(FlashToken.approve(walletTo.address, 1))
      .to.emit(FlashToken, "Approval")
      .withArgs(wallet.address, walletTo.address, 1);

    expect(
      await FlashToken.allowance(wallet.address, walletTo.address)
    ).to.equal(1);
  });

  it("transfer", async () => {

    let AMOUNT = await mintTokens(FlashToken, wallet.address);

    await expect(FlashToken.transfer(walletTo.address, AMOUNT))
      .to.emit(FlashToken, "Transfer")
      .withArgs(wallet.address, walletTo.address, AMOUNT);

    expect(await FlashToken.balanceOf(walletTo.address)).to.equal(AMOUNT);

  });


  it("transfer fail -> this token address", async () => {

    let AMOUNT = await mintTokens(FlashToken, wallet.address);

    await expect(FlashToken.transfer(FlashToken.address, AMOUNT))
      .to.be.revertedWith("FlashToken:: RECEIVER_IS_TOKEN_OR_ZERO");

  });


  it("transfer fail -> underflow", async () => {
    await expect(FlashToken.transfer(walletTo.address, 1)).to.be.revertedWith(
      "MATH:SUB_UNDERFLOW"
    );
  });

  it("transfer fail -> zero address", async () => {

    let AMOUNT = await mintTokens(FlashToken, wallet.address);

    await expect(FlashToken.transfer(constants.AddressZero, AMOUNT))
      .to.be.revertedWith("FlashToken:: RECEIVER_IS_TOKEN_OR_ZERO");

  });


  it("transferFrom", async () => {

    let AMOUNT = await mintTokens(FlashToken, wallet.address);

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


  it("permit", async () => {

    let AMOUNT = await mintTokens(FlashToken, wallet.address);

    const deadline: any = constants.MaxUint256;
    const nonces = await FlashToken.nonces(wallet.address);

    const encodeData: any = keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
        [
          await FlashToken.PERMIT_TYPEHASH(),
          wallet.address,
          walletTo.address,
          AMOUNT,
          nonces,
          deadline,
        ]
      )
    );

    const digest: any = keccak256(
      solidityPack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        ["0x19", "0x01", , await FlashToken.getDomainSeparator(), encodeData]
      )
    );

    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), "hex"),
      Buffer.from(wallet.privateKey.slice(2), "hex")
    );

    await expect(
      FlashToken.permit(
        wallet.address,
        walletTo.address,
        AMOUNT,
        deadline,
        v,
        hexlify(r),
        hexlify(s)
      )
    ).to.emit(FlashToken, "Approval");

  });

  it("flashmint", async () => {
    let MinterContract: any = await deployContract(wallet, MinterContractArtifact, [FlashToken.address]);
    let encode = ethers.utils.defaultAbiCoder.encode(['bool', 'uint256', 'address'], [false, '1000000000000000000', wallet.address]);
    await expect(MinterContract.flashMint("1000000000000000000", encode)
    ).to.emit(FlashToken, "Transfer");
    expect(await FlashToken.flashSupply()).to.equal(0);
  })

  it("flashmint fail", async () => {
    let MinterContract: any = await deployContract(wallet, MinterContractArtifact, [FlashToken.address]);
    let encode = ethers.utils.defaultAbiCoder.encode(['bool', 'uint256', 'address'], [true, '1000000000000000000', wallet.address]);
    await expect(MinterContract.flashMint("1000000000000000000", encode))
      .to.be.revertedWith("FlashToken:: TRANSFER_EXCEED_BALANCE");
  })
});
