
import React from "react";
import "./index.css";
import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";
import {Color, ELIXIR, DELAY, ARROW_TIME, LoginType} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap} from "../data/maps.mjs";
import {SquareType} from "./view_enums.mjs";
import {BoardView} from "./boardview.js";
import {ChatBox} from "./chatbox.js";
import {HoverButton} from "./hoverbutton.js";
import abort from "./img/abort.png";
import exit from "./img/exit.png";
import resign from  "./img/flag.png";

const abort_img = <img className="innerimg" src={abort} alt="?" />
const exit_img = <img className="innerimg" src={exit} alt="?" />
const resign_img = <img className="innerimg" src={resign} alt="?" />

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
  if(!props.userReady || !props.opponentReady) {
    return {
      board: ChessBoard.startingPosition(),
      delay: ChessMap.fromDefault(0),
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
    moveArrows:moveArrows,
  }
}

/**
 * Helper function
 */
function computeElixirAmount(props, now) {
  if(!props.userReady || !props.opponentReady || props.gameOver) return 0;
  if(props.color === Color.WHITE) {
    return (now - props.gamedata.history.head.wStart) / ELIXIR;
  }
  if(props.color === Color.BLACK) {
    return (now - props.gamedata.history.head.bStart) / ELIXIR;
  }
  throw new Error("????");
}

/**
 * Renders the UserReady button
 */
function UserReadyButton(props) {
  if(props.gameOver && props.loginType === LoginType.LOGIN) {
    if(props.userRematch) {
      return <HoverButton
        innerHTML={"Rematch offered"}
        innerHTMLHover={"Cancel rematch?"}
        className={"ready online"}
        classNameHover={"ready offline"}
        onClick={props.cancelRematch}
      />
    } else if(props.opponentRematch) {
      return <HoverButton
        innerHTML={"Accept rematch?"}
        innerHTMLHover={"Accept rematch?"}
        className={"ready offline"}
        classNameHover={"ready offline"}
        onClick={props.offerRematch}
      />
    } else {
      return <HoverButton
        innerHTML={"Offer rematch?"}
        innerHTMLHover={"Offer rematch?"}
        className={"ready offline"}
        classNameHover={"ready online"}
        onClick={props.offerRematch}
      />
    }
  }
  //else the game is not yet over
  if(props.userReady) {
    return <button className={"ready online"}>{"I'm ready"}</button>
  }
  return <HoverButton
    innerHTML={"Start the game"}
    innerHTMLHover={"Ready?"}
    className={"ready offline"}
    classNameHover={"ready online"}
    onClick={props.onReady}
  />
}

/**
 * Renders the opponent ready button
 */
function OpponentReadyButton(props) {
  if(props.gameOver && props.loginType === LoginType.LOGIN) {
    if(props.opponentRematch) {
      return <button className={"ready online"}>{"Rematch offered"}</button>
    } else {
      return <button className={"ready offline"}>
        {"Considering a rematch..."}
      </button>
    }
  }
  if(props.opponentReady) {
    return <button className={"ready online"}>{"Opponent ready!"}</button>
  }
  return <button className={"ready offline"}>{"Opponent preparing..."}</button>
}

/**
 * Renders the lower left button on the user's control panel
 */
function LowerLeftControl(props) {
  return <HoverButton
    innerHTML={"1/2"}
    innerHTMLHover={"1/2"}
    className={"controlbutton draw"}
    classNameHover={"controlbutton draw drawhover"}
    onClick={props.draw}
  />
}

/**
 * Renders the lower right button the user's control panel
 */
function LowerRightControl(props) {
  if(props.gameOver) {
    return <HoverButton
      innerHTML={exit_img}
      innerHTMLHover={exit_img}
      className={"controlbutton resign"}
      classNameHover={"controlbutton resign resignhover"}
      onClick={props.exit}
    />
  }
  if(props.userReady && props.opponentReady) {
    return <HoverButton
      innerHTML={resign_img}
      innerHTMLHover={resign_img}
      className={"controlbutton resign"}
      classNameHover={"controlbutton resign resignhover"}
      onClick={props.resign}
    />
  }
  return <HoverButton
    innerHTML={abort_img}
    innerHTMLHover={abort_img}
    className={"controlbutton resign"}
    classNameHover={"controlbutton resign resignhover"}
    onClick={props.abort}
  />
}

/**
 * Renders the full game screen in desktop mode, requires the following props:
 *   - color (Color): which side to view the board from
 *   - gamedata (GameData): a GameData object that represents the current state
 *     of the game
 *   - user (string): the current user's username
 *   - userElo (optional int): the current user's elo, or undefined if playing
 *       as guest
 *   - loginType (LoginType): whether the user is logged in, guest, or 
 *     spectating
 *   - chat (list of {sender, message}): messages currently existing in the chat
 *   - opponent (string): the current opponent's username
 *   - opponentElo (optional int): the current opponent's elo, or undefined if
 *       playing as guest
 *   - userReady (bool): whether the user is ready to play
 *   - opponentReady (bool): whether the opponent is ready to play
 *   - userRematch (bool): whether the user has offered a rematch
 *   - opponentRematch (bool): whether the opponent has offered a rematch
 *   - gameOver (bool): returns whether the game has ended.
 *   - squareType (ChessMap<SquareType>): input to BoardView
 *   - onMouseDown ((r, c, x, y, b) => (None)): input to BoardView
 *   - onMouseUp ((r, c, x, y) => (None)): input to BoardView
 *   - onMouseMove ((x, y) => (None)): input to BoardView
 *   - translate (ChessMap<[dx, dy]>): input to BoardView
 *   - userArrows (list of {iRow, iCol, fRow, fCol}): input to BoardView
 *   - sendMessage ((string) => (None)): a function to call when the user
 *     attempts to send a message
 *   - abort (() => (None)): a function to call when the user tries to abort
 *   - resign (() => (None)): a function to call when the user tries to resign
 *   - draw (() => (None)): a function to call when the user tries to offer a
 *     draw
 *   - exit (() => (None)): a function to call when the user tries to exit
 *   - offerRematch: a function to call when the user tries to offer a rematch
 *   - cancelRematch: a function to call when the user tries to cancel a
 *     rematch
 *   - onReady: a function to call when the user declares ready
 */
function GameDesktop(props) {
  let now = Date.now();
  let boardProps = getBoardProps(props, now);
  let boardview = <BoardView
    color={props.color}
    board={boardProps.board}
    delay={boardProps.delay}
    squareType={props.squareType}
    onMouseDown={props.onMouseDown}
    onMouseUp={props.onMouseUp}
    onMouseMove={props.onMouseMove}
    translate={props.translate}
    moveArrows={boardProps.moveArrows}
    userArrows={props.userArrows}
  />
  let elixirAmount = computeElixirAmount(props, now);
  return <div>
    <HeaderRow username={props.user} loginType={props.loginType} />
    <div className="gamecontainer">
      <div>
        {boardview}
        <div className={"resourcebar"}>
          <ResourceBar 
            amount={elixirAmount}
            animate={props.userReady && props.opponentReady && !props.gameOver}
          />
        </div>
      </div>
      <div className="metabox">
        <InfoBar user={props.opponent} elo={props.opponentElo} />
        <OpponentReadyButton {...props} />
        <div>
          <ChatBox messages={props.chat} sendMessage={props.sendMessage} />
        </div>
        <UserReadyButton {...props}/>
        <InfoBar user={props.user} elo={props.userElo} />
        <div className={"gamectrl"}>
          <LowerLeftControl {...props} />
          <LowerRightControl {...props} />
        </div>
      </div>
    </div>
  </div>

}

export {GameDesktop}
