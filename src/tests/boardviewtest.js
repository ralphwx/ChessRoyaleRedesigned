//To run this test, copy this file into src/index.js and run npm start. Visually
//verify that the board elements are displayed in a reasonable way.
//This is for testing the implementation of BoardView

import React from "react";
import ReactDOM from "react-dom/client";

import {BoardView} from "./frontend/boardview.js";
import {ChessBoard} from "./data/chess.mjs";
import {SquareType} from "./frontend/view_enums.mjs";
import {Color, DELAY} from "./data/enums.mjs";
import {ChessMap} from "./data/maps.mjs";

let color = Color.BLACK;
let squareType = ChessMap.fromInitializer((r, c) => {
  if((r + c) & 1) return SquareType.ODD;
  return SquareType.EVEN;
});
let translate = ChessMap.fromDefault([0, 0]);
translate.set(6, 1, [10, -100]);
let delay = ChessMap.fromDefault(Date.now() - DELAY);
let board = ChessBoard.startingPosition();
board = board.move(1, 4, 3, 4);
board = board.move(6, 4, 4, 4);
board = board.move(6, 5, 5, 5);
let main = <BoardView color={color} board={board} delay={delay} 
  squareType={squareType} translate={translate} 
  userArrows={[
    {iRow: 7, iCol: 6, fRow: 5, fCol: 5},
    {iRow: 0, iCol: 1, fRow: 1, fCol: 3}
  ]} 
  moveArrows={[
    {iRow: 1, iCol: 4, fRow: 3, fCol: 4, time:Date.now(), color:Color.WHITE},
    {iRow: 6, iCol: 4, fRow: 4, fCol: 4, time:Date.now(), color:Color.BLACK}
  ]} 
  onMouseMove={() => {}}
  onMouseUp={() => {}}
  onMouseDown={() => {}}
/>;

squareType.set(0, 0, SquareType.SELECT);
squareType.set(1, 3, SquareType.PREMOVE_SRC);
squareType.set(3, 3, SquareType.PREMOVE_DEST);
squareType.set(3, 4, SquareType.HIGHLIGHT);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<div style={{width: "50%", height: "50%"}}>{main}</div>);
