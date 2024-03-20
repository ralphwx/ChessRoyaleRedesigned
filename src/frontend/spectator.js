
import React from "react";
import ReactDOM from "react-dom/client";
import {SpectatorController} from "./spectator_controller.mjs";
import {GameModel} from "./game_model.mjs";
import {connect} from "./metaauthclient.mjs";
import {Game} from "./game_screen.js";
import {LoginType, URL} from "../data/enums.mjs";
import {renderPopUp} from "./popup.js";

function showFatalError(msg) {
  renderPopUp(<h3>{msg}</h3>, [{
    inner: "Okay",
    onClick: () => window.location.replace(URL),
  }]);
}
let user = localStorage.getItem("username");
let psw = localStorage.getItem("password");
let loginType = JSON.parse(localStorage.getItem("loginType"));
if(loginType === LoginType.GUEST) {
  showFatalError("Unfortunately, spectator mode is not yet supported for guest users. Our developer apologizes for spending his time playing Tetris instead of implementing this feature.");
}
loginType = LoginType.SPECTATE;
const queryParameters = new URLSearchParams(window.location.search);
let target = queryParameters.get("user");

connect(URL, user, psw, loginType, target, (socket) => {
  socket.addEventHandler("joined", (meta, args) => {
    socket.notify("redirect?", {}, (meta, args) => {
      if(args === Location.GAME) {
        window.location.replace(URL + "/game");
      } else {
        window.location.reload(true);
      }
    });
  });
  socket.notify("redirect?", {}, (meta, args) => {
    if(args === Location.GAME) {
      window.location.replace(URL + "/game");
    }
  });
  socket.notify("getUserInfo", {user: target}, (meta, args) => {
    if(!args.inGame) {
      showFatalError("User '" + target + "' is not currently playing a game, or their game just ended.");
    }
  });
  let user = socket.user;
  let model = new GameModel(target, socket);
  let controller = new SpectatorController(model, user, socket.lagEstimator);
  let view = <Game controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view)
}, (msg) => {
  showFatalError(msg);
});
