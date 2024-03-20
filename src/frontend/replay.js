import React from "react";
import ReactDOM from "react-dom/client";
import {ReplayDesktop} from "./replay_desktop.js";
import {ReplayController} from "./replay_controller.mjs";
import {GameData, Move} from "../data/gamedata.mjs";
import {Color, ELIXIR} from "../data/enums.mjs";

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
      loginType: props.loginType,
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

let gamedata = new GameData(-1);
gamedata.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
gamedata.move(new Move(Color.WHITE, 2 * ELIXIR, 0, 5, 3, 2));
gamedata.move(new Move(Color.WHITE, 3 * ELIXIR, 3, 2, 6, 5));
gamedata.move(new Move(Color.WHITE, 4 * ELIXIR, 6, 5, 7, 4));

let controller = new ReplayController(gamedata);
let loginUser = "Pot of Queens";
let loginType = undefined;
let color = Color.WHITE;
let user = "Pot of Queen sub";
let userElo = 9999;
let opponent = "Random noob";
let opponentElo = 100;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ReplayScreen 
  gamedata={gamedata}
  controller={controller}
  loginUser={loginUser}
  loginType={loginType}
  color={color}
  user={user}
  userElo={userElo}
  opponent={opponent}
  opponentElo={opponentElo}
/>);
