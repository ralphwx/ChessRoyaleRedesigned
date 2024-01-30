
import React from "react";
import "./index.css";
import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";
import {Color, DELAY} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap} from "../data/maps.mjs";
import {SquareType} from "./view_enums.mjs";
import {BoardView} from "./boardview.js";

function GameDesktop(props) {
  let boardview = <BoardView
    color={Color.WHITE}
    board={ChessBoard.startingPosition()}
    delay={ChessMap.fromDefault(Date.now() - DELAY)}
    squareType={ChessMap.fromInitializer((r, c) => {
      if((r ^ c) & 1) return SquareType.ODD;
      return SquareType.EVEN;
    })}
    onMouseDown={() => {}}
    onMouseUp={() => {}}
    onMouseMove={() => {}}
    translate={ChessMap.fromDefault([0, 0])}
    moveArrows={[]}
    userArrows={[]}
  />
  let elixirAmount = 3.14;
  return <div>
    <HeaderRow />
    <div className="gamecontainer">
      <div>
        {boardview}
        <div className={"resourcebar"}>
          <ResourceBar amount={elixirAmount} />
        </div>
      </div>
      <div className="metabox">
      </div>
    </div>
  </div>

}

export {GameDesktop}
