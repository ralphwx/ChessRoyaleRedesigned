
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./controller.mjs";
import {GameModel} from "./game_model.mjs";
import {connect} from "./metaauthclient.mjs";
import {URL, LoginType, GameOverCause, Color, Location} from "../data/enums.mjs";
import {GameDesktop} from "./game_desktop.js";
import {renderPopUp} from "./popup.js";
import {Game} from "./game_screen.js";

import "./index.css";

let user = localStorage.getItem("username");
let psw = localStorage.getItem("password");
let loginType = JSON.parse(localStorage.getItem("loginType"));

if(!loginType) {
  window.location.replace(URL);
}

connect(URL, user, psw, loginType, undefined, (socket) => {
  socket.addEventHandler("joined", (meta, args) => {
    window.location.reload(true);
  });
  socket.notify("redirect?", {}, (meta, args) => {
    console.log("redirect to? ");
    console.log(args);
    console.log(args === Location.LOBBY);
    if(args === Location.LOBBY) {
      window.location.replace(URL);
    }
  });
  let user = socket.user;
  let model = new GameModel(user, socket);
  let controller = new Controller(model, user, loginType);
  let view = <Game controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view);
}, (msg) => {
  window.location.replace(URL);
});
