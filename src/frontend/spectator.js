
import React from "react";
import ReactDOM from "react-dom/client";
import {SpectatorController} from "./frontend/spectator_controller.mjs";
import {GameModel} from "./frontend/game_model.mjs";
import {connect} from "./frontend/metaauthclient.mjs";
import {GameDesktop} from "./frontend/game_desktop.js";
import {Game} from "./frontend/game_screen.js";
import {LoginType, URL} from "./data/enums.mjs";

let user = "spectatorralph";
let psw = "password";
let loginType = LoginType.SPECTATE;
let target = "devralph1";

connect(URL, user, psw, loginType, target, (socket) => {
  socket.addEventHandler("joined", (meta, args) => {
    socket.notify("redirect?", {}, (meta, args) => {
      if(args === Location.GAME) {
        //redirect to game screen
      } else {
        window.location.reload(true);
      }
    });
  });
  let user = socket.user;
  let model = new GameModel(target, socket);
  let controller = new SpectatorController(model);
  let view = <Game controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view)
}, (msg) => {
  //pop-up + redirect
});
