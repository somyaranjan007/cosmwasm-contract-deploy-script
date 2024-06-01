import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import dotenv from "dotenv";
import fs from 'fs';

dotenv.config();

async function useOptions(options) {
  const mnemonic = process.env.MNEMONICS;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "osmo" });
  const [account] = await wallet.getAccounts();
  const addr = account.address;
  const gasPrice = GasPrice.fromString(options.gasPrice);
  const client = await SigningCosmWasmClient.connectWithSigner(options.rpcEndpoint, wallet, { gasPrice });

  return [addr, client];
}

const osmosisTestnetOptions = {
  rpcEndpoint: "https://rpc.testnet.osmosis.zone",
  gasPrice: "0.025uosmo",
  chainId: "osmo-test-5",
  fees: {
    upload: 20000000
  }
};


(async () => {
  const [addr, client] = await useOptions(osmosisTestnetOptions);
  const wasm = fs.readFileSync("./artifacts/leverage_contract.wasm");
  const uploadFee = calculateFee(osmosisTestnetOptions.fees.upload, osmosisTestnetOptions.gasPrice);

  const result = await client.upload(addr, wasm, uploadFee);
  console.log(result);

  const codeId = result.codeId;
  const defaultFee = { amount: [{ amount: "50000", denom: "uosmo" }], gas: "2000000" };
  const instantiateMsg = { token_contract_address: "usdc" };
  const instantiateResponse = await client.instantiate(addr, codeId, instantiateMsg, "Leverage Trading", defaultFee);
  console.log(instantiateResponse);
})();