import ReactDOM from "react-dom/client";

import {GameMobile} from "./frontend/game_mobile.js";
import {GameData, Move} from "./data/gamedata.mjs";
import {Color, LoginType, ELIXIR, DELAY} from "./data/enums.mjs";
import {ChessMap} from "./data/maps.mjs";
import {SquareType} from "./frontend/view_enums.mjs";

let now = Date.now()
let gamedata = new GameData(now - 2.5 * ELIXIR);
gamedata.move(new Move(Color.WHITE, now - 1, 1, 4, 3, 4));
gamedata.move(new Move(Color.BLACK, now - 1, 6, 2, 4, 2));
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

let squareType = ChessMap.fromInitializer((r, c) => {
  if((r + c) & 1) return SquareType.ODD;
  return SquareType.EVEN;
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<GameMobile 
  color={Color.WHITE}
  gamedata={gamedata}
  loginUser={user}
  user={user}
  userElo={userElo}
  loginType={loginType}
  chat={chat}
  opponent={opponent}
  opponentElo={opponentElo}
  userReady={userReady}
  opponentReady={opponentReady}
  userRematch={undefined}
  opponentRematch={undefined}
  gameOver={false}
  squareType={squareType}
  onMouseDown={(r, c, x, y, b) => console.log("Mouse down " + r + c)}
  onMouseUp={(r, c, x, y) => console.log("Mouse up " + r + c)}
  onMouseMove={(x, y) => {}}
  translate={ChessMap.fromDefault([0, 0])}
  userArrows={[{iRow: 6, iCol: 4, fRow: 5, fCol: 4}]}
  sendMessage={(message) => console.log(message)}
  onReady={() => console.log("ready!")}
/>);
