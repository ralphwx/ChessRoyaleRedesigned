import React from "react";
import ReactDOM from "react-dom/client";

import {BoardView} from "./frontend/boardview.js";
import {ChessBoard} from "./data/chess.mjs";
import {SquareType} from "./frontend/view_enums.mjs";
import {Color} from "./data/enums.mjs";
import {ChessMap} from "./data/maps.mjs";
import {OptionalPair} from "./view_enums.mjs";
import {GameData} from "../data/gamedata.mjs";

let color = Color.BLACK;
let model = new GameData(Date.now());
let squareType = ChessMap.fromInitializer((r, c) => {
  if((r + c) & 1) return SquareType.ODD;
  return SquareType.EVEN;
});
let translate = ChessMap.fromDefault([0, 0]);

let main = <BoardView color={color} board={board} delay={delay} 
  squareType={squareType} translate={translate} userArrows={[]} 
  moveArrows={[{iRow: 1, iCol: 4, fRow: 3, fCol: 4, time:Date.now()}]} 
  onMouseMove={() => {}}
  onMouseUp={() => {}}
  onMouseDown={() => {}}
/>;

squareType.set(0, 0, SquareType.SELECT);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(main);
