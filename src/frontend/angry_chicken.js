
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./controller.mjs";
import {LocalModel} from "./local_model.mjs";
import {ServerGame} from "../backend/servergame.mjs";
import {Game} from "./game_screen.js";
import {runBotLocal} from "../bots/bot_frame.mjs";
import {DemoBot} from "../bots/randy_lv2.mjs";
import {Location, LoginType, URL, Color} from "../data/enums.mjs";
import {connect} from "./metaauthclient.mjs";
import {encodeGameData} from "../data/gamedataencoder.mjs";
import {OFFLINE} from "./config.js";

let user = localStorage.getItem("username");
let psw = localStorage.getItem("password");
let loginType = JSON.parse(localStorage.getItem("loginType"));

let bot_name = "Angry Chicken";

let playAsBlack = JSON.parse(localStorage.getItem("playAsBlack?"));
localStorage.setItem("playAsBlack?", !playAsBlack);

if(loginType !== LoginType.LOGIN && loginType !== LoginType.GUEST) {
  window.location.replace(URL);
}

function generateReplay(servergame) {
  if(OFFLINE) return;
  if(loginType !== LoginType.LOGIN && loginType !== LoginType.GUEST) {
    return;
  }
  connect(URL, user, psw, loginType, undefined, (socket) => {
    socket.notify("saveGame", {gamedata: encodeGameData(servergame.gameState),
      white: servergame.white, black: servergame.black}, (meta, args) => {
        if(args.success) {
          let color = servergame.black === user ? Color.BLACK : Color.WHITE;
          servergame.chatMessage("[system]", "Replay available at: " + 
            URL + "/replay?id=" + args.id + "&color=" + color);
        }
      });
  }, (msg) => {

  });
}

let game = new ServerGame(user, bot_name);
if(playAsBlack) {
  game = new ServerGame(bot_name, user);
}
let model = new LocalModel(user, game, "", "500", generateReplay);
let controller = new Controller(model, user, loginType);
let view = <Game controller={controller} />

if(!OFFLINE) {
  connect(URL, user, psw, loginType, undefined, (socket) => {
    if(loginType === LoginType.LOGIN) {
      socket.notify("getUserInfo", {user: user}, (meta, args) => {
        model.userElo = args.elo;
        model.metaUpdate();
      });
    }
    socket.notify("redirect?", {}, (meta, args) => {
      if(args === Location.GAME) {
        window.location.replace(URL + "/game");
      }
    });
  }, (msg) => {
  });
}

let bot = new DemoBot();
runBotLocal(bot.moveValue, bot.elixirValue, 1000, 300, game, bot_name);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(view);

