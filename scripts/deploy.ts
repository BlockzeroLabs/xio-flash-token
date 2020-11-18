// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
import { ethers } from "@nomiclabs/buidler";
import { Contract, ContractFactory } from "ethers";

async function main(): Promise<void> {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const INITIAL_MINTER = "0x9D1040827fD85ccd3B59Ab96FD8CAf0dbFcAC44e"; //Ganache address

  // We get the contract to deploy
  const FlashToken: ContractFactory = await ethers.getContractFactory("FlashToken");
  console.log(`Start deploying Flash Token with initial minter: ${INITIAL_MINTER}`);
  const flashToken: Contract = await FlashToken.deploy(INITIAL_MINTER);
  await flashToken.deployed();

  console.log("Flash Token deployed to: ", flashToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
