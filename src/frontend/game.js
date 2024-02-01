
import React from "react";
import "./index.css";
import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";
import {Color, DELAY, LoginType} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap} from "../data/maps.mjs";
import {SquareType} from "./view_enums.mjs";
import {BoardView} from "./boardview.js";
import {ChatBox} from "./chatbox.js";
import abort from "./img/abort.png";

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
    <HeaderRow username={"devralph"} loginType={LoginType.LOGIN} />
    <div className="gamecontainer">
      <div>
        {boardview}
        <div className={"resourcebar"}>
          <ResourceBar amount={elixirAmount} />
        </div>
      </div>
      <div className="metabox">
        <div className={"info online"}>{"Opponent (elo)"}</div>
        <button className={"ready online"}>Ready!</button>
        <div>
          <ChatBox messages={[{sender: "[system]", message:"hi"}]} sendMessage={() => {}} />
        </div>
        <button className={"ready offline"}>Start the game</button>
        <div className={"info online"}>{"Username (elo)"}</div>
        <div className={"gamectrl"}>
          <button className={"controlbutton draw"}>1/2</button>
          <button className={"controlbutton resign"}>
            <img className={"innerimg"} src={abort} alt={"?"}/>
          </button>
        </div>
      </div>
    </div>
  </div>

}

export {GameDesktop}
