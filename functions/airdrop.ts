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
  description: "let's get folks rich, shall we?",
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
      run: {
        type: Schema.types.number,
        description: "check",
      },
      user: {
        type: Schema.slack.types.user_id,
        description: "User the airdrop was sent to",
      },
    },
    required: ["run"],
  },
});

export default SlackFunction(
  AirdropFunctionDefinition,
  async ({ inputs, client }) => {
    const { address, amount, user } = inputs;
    try {
      if (!isValidAddress(address)) throw new Error("Invalid Recipient");
      const api = await initialize(config.endpoint);
      const keyring = getKeyringFromSeed(config.seed);
      const options = { app_id: 0, nonce: -1 };
      const decimals = getDecimals(api);
      const _amount = formatNumberToBalance(amount, decimals);
      const channelId = "C06CVL92NF7";
      await api.tx.balances.transfer(
        address,
        _amount,
      ).signAndSend(keyring, options, async ({ status, events }) => {
        
        if (status.isInBlock) {
          events.forEach(async ({ event: { data, method, section } }) => {
            try {
              const result = await client.chat.postMessage({
                channel: channelId,
                text:
                  `Transaction included at blockHash ${status.asInBlock} \t' ${section}.${method}:: ${data}\n for user ${user}`,
              });
              return result;
            } catch (error) {
              return error;
            }
          });
        } else {
          try {
            const result = await client.chat.postMessage({
              channel: channelId,
              text: `Txn failed for ${user}`,
            });   
            return result;
          } catch (error) {
            return error;
          }
        }
      });
    } catch (err) {
      const channelId = "C06CVL92NF7";
      try {
        const result = await client.chat.postMessage({
          channel: channelId,
          text: `Txn failed for ${user} due to ${err}`,
        });   
        return result;
      } catch (error) {
        return error;
      }
    }

    return new Promise((resolve, reject) => {
      resolve({ outputs: {run: 1} });
      reject({ outputs:  {run: 0}  });
    });
  },
);
