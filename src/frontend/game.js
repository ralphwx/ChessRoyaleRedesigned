
import React from "react";
import "./index.css";
import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";
import {Color, DELAY, ARROW_TIME, LoginType} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap} from "../data/maps.mjs";
import {SquareType} from "./view_enums.mjs";
import {BoardView} from "./boardview.js";
import {ChatBox} from "./chatbox.js";
import abort from "./img/abort.png";

/**
 * Sub-component of GameDesktop
 */
function InfoBar(props) {
  if(props.elo !== undefined) {
    return <div className={"info online"}>
      {props.user + " (" + props.elo + ")"}
    </div>
  }
  return <div className={"info online"}>
    {props.user}
  </div>
}

/**
 * Helper function for rendering the board. Returns
 * {board, delay, squareType, moveArrows}
 */
function getBoardProps(props, now) {
  let squareTypes = ChessMap.fromInitializer((r, c) => {
    if((r ^ c) & 1) return SquareType.ODD;
    return SquareType.EVEN;
  });
  if(!props.userReady || !props.opponentReady) {
    return {
      board: ChessBoard.startingPosition(),
      delay: ChessMap.fromDefault(0),
      squareType: squareTypes,
      moveArrows:[]
    }
  }
  let moveArrows = [];
  let moveHistory = props.gamedata.history.head.moveHistory;
  while(moveHistory.length > 0 && moveHistory.head.time > now - ARROW_TIME) {
    moveArrows.push(moveHistory.head);
    moveHistory = moveHistory.tail;
  }
  return {
    board: props.gamedata.getBoard(),
    delay: props.gamedata.history.head.delay,
    squareType: squareTypes,
    moveArrows:moveArrows,
  }
}
/**
 * Renders the full game screen in desktop mode, requires the following props:
 *   - color (Color): which side to view the board from
 *   - game (GameData): a GameData object that represents the current state
 *     of the game
 *   - user (string): the current user's username
 *   - userElo (optional int): the current user's elo, or undefined if playing
 *       as guest
 *   - loginType (LoginType): whether the user is logged in, guest, or spectating
 *   - chat (list of {sender, message}): messages currently existing in the chat
 *   - opponent (string): the current opponent's username
 *   - opponentElo (optional int): the current opponent's elo, or undefined if
 *       playing as guest
 *   - userReady (bool): whether the user is ready to play
 *   - opponentReady (bool): whether the opponent is ready to play
 */
function GameDesktop(props) {
  let now = Date.now();
  let boardProps = getBoardProps(props, now);
  let boardview = <BoardView
    color={props.color}
    board={boardProps.board}
    delay={boardProps.delay}
    squareType={boardProps.squareType}
    onMouseDown={() => {}}
    onMouseUp={() => {}}
    onMouseMove={() => {}}
    translate={ChessMap.fromDefault([0, 0])}
    moveArrows={boardProps.moveArrows}
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
        <InfoBar user={props.opponent} elo={props.opponentElo} />
        <button className={"ready online"}>Ready!</button>
        <div>
          <ChatBox messages={props.chat} sendMessage={() => {}} />
        </div>
        <button className={"ready offline"}>Start the game</button>
        <InfoBar user={props.user} elo={props.userElo} />
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
