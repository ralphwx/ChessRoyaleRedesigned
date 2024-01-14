import {createServer} from "http";
const server = createServer();

import {MetaAuthServer} from "../backend/metaauthserver.mjs";

let authserver = new MetaAuthServer(server, "./users/");

authserver.addEventHandler("data", (meta, args, ack) => {
  console.log("Received data: ");
  console.log("  meta: " + JSON.stringify(meta));
  console.log("  data: " + args.data);
  ack();
});

server.listen(8080, () => {
  console.log("listening on *:8080");
});
