import React from "react";
import ReactDOM from "react-dom/client";
import {ReplayDesktop} from "./replay_desktop.js";
import {ReplayController} from "./replay_controller.mjs";
import {GameData, Move} from "../data/gamedata.mjs";
import {Color, ELIXIR, URL, LoginType} from "../data/enums.mjs";
import {encodeGameData, decodeGameData} from "../data/gamedataencoder.mjs";
import {renderPopUp} from "./popup.js";
import {connect} from "./metaauthclient.mjs";

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

function fatalError(msg) {
  renderPopUp(<h2>{msg}</h2>, [{
    inner: "Exit",
    onClick: () => {window.location.replace(URL)},
  }]);
}

function retryError(msg) {
  renderPopUp(<h2>{msg}</h2>, [{
    inner: "Retry",
    onClick: () => {window.location.reload(true)},
  },
  {
    inner: "Exit",
    onClick: () => {window.location.replace(URL)},
  },]);
}

const queryParameters = new URLSearchParams(window.location.search);
const root = ReactDOM.createRoot(document.getElementById("root"));

let id = queryParameters.get("id");
if(!id) {
  fatalError("Request replay was not found");
}

let timeoutThread = setTimeout(() => {
  retryError("Failed to download replay data. Try again?");
}, 2000);

connect(URL, undefined, undefined, LoginType.GUEST, undefined, (socket) => {
  socket.notify("loadGame", id, (meta, args) => {
    clearInterval(timeoutThread);
    console.log(args);
    let gamedata = decodeGameData(args.gamedata);
    let controller = new ReplayController(gamedata);
    let loginUser = window.localStorage.getItem("username");
    if(!loginUser) loginUser = "[not logged in]";
    let color = queryParameters.get("color");
    if(!color) {
      if(window.localStorage.getItem("username") === args.black) {
        color = Color.BLACK;
      } else {
        color = Color.WHITE;
      }
    }
    else color = Number(color);
    let white = args.white;
    let black = args.black;
    let whiteElo = args.whiteElo;
    let blackElo = args.blackElo;
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
  });
}, (msg) => {
  retryError("Failed to download replay data. Try again?");
});
