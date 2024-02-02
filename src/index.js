import ReactDOM from "react-dom/client";

import {GameDesktop} from "./frontend/game.js";
import {GameData, Move} from "./data/gamedata.mjs";
import {Color, LoginType, ELIXIR, DELAY} from "./data/enums.mjs";

let now = Date.now()
let gamedata = new GameData(now - 2 * ELIXIR);
gamedata.move(new Move(Color.WHITE, now - 0.3 * DELAY, 1, 4, 3, 4));
gamedata.move(new Move(Color.BLACK, now - 0.3 * DELAY, 6, 2, 4, 2));
let user = "devralph";
let userElo = 900;
let loginType = LoginType.LOGIN;
let chat = [
  {sender: "devralph", message: "glhf"},
  {sender: "[system]", message: "Game started"},
];
let opponent = "opponent";
let opponentElo = 900;
let userReady = true;
let opponentReady = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<GameDesktop 
  color={Color.WHITE}
  gamedata={gamedata}
  user={user}
  userElo={userElo}
  loginType={loginType}
  chat={chat}
  opponent={opponent}
  opponentElo={opponentElo}
  userReady={userReady}
  opponentReady={opponentReady}
/>);
