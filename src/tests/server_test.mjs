
import {connect} from "../frontend/metaauthclient.mjs";
import {LoginType, Location} from "../data/enums.mjs";
import {test, printResults} from "./test_framework.mjs";

//Two test users, devralph1 and devralph2, are already created. Both users
// use "password" as their password
connect("http://localhost:8080", "devralph1", "password", LoginType.LOGIN, (socket) => {
  function send(eventName, data) {
    return new Promise((resolve) => {
      socket.notify(eventName, data, (meta, args) => {
        resolve({meta, args});
      });
    });
  }
  (async () => {
    console.log("Successfully logged in");
    let joinedReceived = false;
    socket.addEventHandler("joined", (meta, args) => {
      joinedReceived = true;
    });
    let {meta, args} = await send("redirect?");
    test("redirect? 1", () => {return args === Location.LOBBY});
    ({meta, args} = await send("lobbyData"));
    test("empty lobby", () => {
      if(args.open.length > 0) return false;
      if(args.incoming.length > 0) return false;
      return args.outgoing.length === 0;
    });
  })();
},
(msg) => {
  console.log(msg);
});
