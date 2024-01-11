import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  formatNumberToBalance,
  getDecimals,
  getKeyringFromSeed,
  initialize,
  isValidAddress,
} from "npm:avail-js-sdk";
import config from "../config.ts";
export const AirdropFunctionDefinition = DefineFunction({
  callback_id: "airdrop_avl",
  title: "Airdrop",
  description: "let's get rich folks, shall we?",
  source_file: "functions/airdrop.ts",
  input_parameters: {
    properties: {
      address: {
        type: Schema.types.string,
        description: "address to send to",
      },
      amount: {
        type: Schema.types.number,
        description: "the amount",
      },
      user: {
        type: Schema.slack.types.user_id,
        description: "User to send airdrop to",
      },
    },
    required: ["address", "amount", "user"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "result",
      },
    },
    required: ["result"],
  },
});

export default SlackFunction(
  AirdropFunctionDefinition,
  async ({ inputs }) => {
    try {
      const { address, amount, user } = inputs;
      if (!isValidAddress(address)) {
        const result = `txn failed due to invalid address`
        return { outputs: { result } };
      }
  
      const api = await initialize(config.endpoint);
      const keyring = getKeyringFromSeed(config.seed);
      const options = { app_id: 0, nonce: -1 };
      const decimals = getDecimals(api);
      const _amount = formatNumberToBalance(amount, decimals);
  
      const result: string = await new Promise((resolve, reject) => {
        api.tx.balances
          .transfer(address, _amount)
          .signAndSend(keyring, options, ({ status, events }) => {
            if (status.isInBlock) {
              console.log(`Transaction included at blockHash ${status.asInBlock} for user ${user}`);
              events.forEach(({ event: { data, method, section } }) => {
                console.log(`\t' ${section}.${method}:: ${data}`);
              });
              resolve(`Transaction successful with hash: ${status.asInBlock}`);
            } else if (status.isFinalized) {
              reject(`Transaction failed. Status: ${status}`);
            }
          });
      });
  
      return { outputs: { result } }; 
    } catch (error) {
      console.error(error);
      const result = `txn failed due to ${error}`
      return { outputs: { result } };
    }
  }
  
);
