
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./controller.mjs";
import {GameModel} from "./game_model.mjs";
import {connect} from "./metaauthclient.mjs";
import {URL, Location} from "../data/enums.mjs";
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
    if(args === Location.LOBBY) {
      window.location.replace(URL);
    }
  });
  let user = socket.user;
  let model = new GameModel(user, socket);
  let controller = new Controller(model, user, loginType, socket.lagEstimator);
  let view = <Game controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view);
}, (msg) => {
  window.location.replace(URL);
});
