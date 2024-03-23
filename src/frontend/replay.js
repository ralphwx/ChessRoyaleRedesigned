import React from "react";
import ReactDOM from "react-dom/client";
import {ReplayDesktop} from "./replay_desktop.js";
import {ReplayController} from "./replay_controller.mjs";
import {GameData, Move} from "../data/gamedata.mjs";
import {Color, ELIXIR, URL} from "../data/enums.mjs";
import {encodeGameData, decodeGameData} from "../data/gamedataencoder.mjs";
import {renderPopUp} from "./popup.js";

class ReplayScreen extends React.Component {
  constructor(props) {
    super(props);
    this.controller = props.controller;
    this.controller.addListener(() => {
      this.setState(this.controller.getViewState());
    });
    this.state = {
      gamedata: props.gamedata,
      loginUser: props.loginUser,
      color: props.color,
      user: props.user,
      userElo: props.userElo,
      opponent: props.opponent,
      opponentElo: props.opponentElo,
    }
    Object.assign(this.state, this.controller.getViewState());
  }
  render() {
    return <ReplayDesktop {...this.state} />;
  }
}

const queryParameters = new URLSearchParams(window.location.search);
let data = queryParameters.get("data");
if(data === null) {
  renderPopUp(<h2>Replay data not found</h2>, [{
    inner: "Exit",
    onClick: () => {window.location.replace(URL)},
  }]);
}
let gamedata;
try {
  gamedata = decodeGameData(data);
} catch(error) {
  renderPopUp(<h2>Error loading replay</h2>, [{
    inner: "Exit",
    onClick: () => {window.location.replace(URL)},
  }]);
}
let controller = new ReplayController(decodeGameData(data));
let loginUser = window.localStorage.getItem("username");
if(!loginUser) loginUser = "[not logged in]";
let color = queryParameters.get("color");
if(!color) color = Color.WHITE;
let white = queryParameters.get("white");
let black = queryParameters.get("black");
let whiteElo = queryParameters.get("whiteElo");
let blackElo = queryParameters.get("blackElo");
let user;
let userElo;
let opponent;
let opponentElo;
if(color === Color.WHITE) {
  user = white;
  userElo = whiteElo;
  opponent = black;
  opponentElo = blackElo;
} else {
  user = black;
  userElo = blackElo;
  opponent = white;
  opponentElo = whiteElo;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ReplayScreen 
  gamedata={gamedata}
  controller={controller}
  loginUser={loginUser}
  color={color}
  user={user}
  userElo={userElo}
  opponent={opponent}
  opponentElo={opponentElo}
/>);
