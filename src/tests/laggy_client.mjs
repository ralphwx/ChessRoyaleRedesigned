import {connect} from "../frontend/metaauthclient.mjs";
import {LoginType} from "../data/enums.mjs";

connect("http://localhost:8080", undefined, undefined, LoginType.GUEST,
  (socket) => {
    console.log("Connected.");
    socket.notify("data", {data: 3}, (meta, args) => {
      console.log(JSON.stringify(meta));
    });
  },
  (msg) => {
    console.log(msg);
  }
);
