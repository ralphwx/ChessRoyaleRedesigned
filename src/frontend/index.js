import React from "react";
import ReactDOM from "react-dom/client";

import {BoardView} from "./frontend/boardview.js";
import {ChessBoard} from "./data/chess.mjs";
import {SquareType} from "./frontend/view_enums.mjs";
import {Color} from "./data/enums.mjs";
import {ChessMap} from "./data/maps.mjs";

let color = Color.WHITE;
let board = ChessBoard.startingPosition();
let delay = ChessMap.fromDefault(0);
let squareType = ChessMap.fromInitializer((r, c) => {
  if((r + c) & 1) return SquareType.ODD;
  return SquareType.EVEN;
});
let translate = ChessMap.fromDefault([0, 0]);

let main = <BoardView color={color} board={board} delay={delay} squareType={squareType} translate={translate} />;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(main);
