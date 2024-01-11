import { Manifest } from "deno-slack-sdk/mod.ts";
import { AirdropFunctionDefinition } from "./functions/airdrop.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "airdrop-bot",
  description: "A template for building standalone functions in Slack",
  icon: "assets/icon.png",
  functions: [AirdropFunctionDefinition],
  workflows: [],
  outgoingDomains: ["goldberg.avail.tools"],
  datastores: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
