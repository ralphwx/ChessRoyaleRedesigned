import {URL, LoginType} from "../data/enums.mjs";
import {connect} from "../frontend/metaauthclient.mjs";

connect(URL, "devralph1", "password", LoginType.SPECTATE, "ralphwx", (socket) => {
  console.log("connected");
}, (msg) => {
  console.log(msg);
});
