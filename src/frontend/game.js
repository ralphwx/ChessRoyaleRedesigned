
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./frontend/controller.mjs";
import {GameModel} from "./frontend/game_model.mjs";
import {connect} from "./frontend/metaauthclient.mjs";
import {URL, LoginType, GameOverCause, Color} from "./data/enums.mjs";
import {GameDesktop} from "./frontend/game_desktop.js";
import {renderPopUp} from "./frontend/popup.js";
import {Game} from "./frontend/game_screen.js";

import "./frontend/index.css";

//let user = "Guest#1";
//let psw = undefined;
//let loginType = LoginType.GUEST;
let user = "devralph1";
let psw = "password";
let loginType = LoginType.LOGIN;

if(loginType === undefined) {
  //redirect
}

connect(URL, user, psw, loginType, (socket) => {
  socket.addEventHandler("joined", (meta, args) => {
    window.location.reload(true);
  });
  socket.notify("redirect?", {}, (meta, args) => {
    if(args !== Location.GAME) {
      //redirect
    }
  });
  let user = socket.user;
  let model = new GameModel(user, socket);
  let controller = new Controller(model, loginType);
  let view = <Game controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view);
}, (msg) => {
  //redirect
});
