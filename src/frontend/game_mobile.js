
import ReactDOM from "react-dom/client";
import {HeaderRow} from "./header.js";
import {BoardView} from "./boardview.js";
import {ResourceBar} from "./resourcebar.js";
import {HoverButton} from "./hoverbutton.js";
import {HoverDiv} from "./hoverdiv.js";
import {ChatBox} from "./chatbox.js";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap} from "../data/maps.mjs";
import {ARROW_TIME, Color, ELIXIR, LoginType} from "../data/enums.mjs";

import exit from "./img/exit.png";
import resign from "./img/flag.png";
import abort from "./img/abort.png";

import "./index.css";

const abort_img = <img className="innerimg" src={abort} alt="?" />;
const exit_img = <img className="innerimg" src={exit} alt="?" />;
const resign_img = <img className="innerimg" src={resign} alt="?" />;

/**
 * Helper functions taken from game_desktop.js
 */
function getBoardProps(props, now) {
  if(!props.gamedata || !props.userReady || !props.opponentReady) {
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

function computeElixirAmount(props, now) {
  if(!props.gamedata
    || !props.userReady
    || !props.opponentReady
    || props.gameOver) {
    return 0;
  }
  if(props.color === Color.WHITE) {
    return (now - props.gamedata.history.head.wStart) / ELIXIR;
  }
  if(props.color === Color.BLACK) {
    return (now - props.gamedata.history.head.bStart) / ELIXIR;
  }
  throw new Error("????");
}

function LowerLeftControl(props) {
  if(props.loginType === LoginType.SPECTATE) return <div></div>
  return <button
    className={"controlbutton draw"}
    onClick={props.draw}
    title={"Offer/Accept draw"}
  >
    1/2
  </button>
}

function LowerRightControl(props) {
  if(props.loginType === LoginType.SPECTATE || props.gameOver) {
    return <button
      className={"controlbutton resign"}
      onClick={props.exit}
      title={"Return to Lobby"}>
      {exit_img}
    </button>
  }
  if(props.userReady && props.opponentReady) {
    return <button
      className={"controlbutton resign"}
      onClick={props.resign}
      title={"Resign"}>
      {resign_img}
    </button>
  }
  return <button
    className={"controlbutton resign"}
    onClick={props.abort}
    title={"Abort"}>
    {abort_img}
  </button>
}

function InfoBar(props) {
  if(props.elo) {
    return <div className="infovert online">
      {props.user + " (" + props.elo + ")"}
    </div>
  }
  return <div className="infovert online">
    {props.user}
  </div>
}

function OpponentReadyButton(props) {
  if(props.gameOver) {
    if(props.opponentRematch) {
      return <div className={"readyvert online"}>{"Rematch offered"}</div>
    } else {
      return <div className={"ready offline"}>
        Considering a rematch...
      </div>
    }
  }
  if(props.opponentReady) {
    return <div className="readyvert online">
      Opponent ready!
    </div>
  }
  return <div className="ready offline">
    Opponent preparing...
  </div>
}

function UserReadyButton(props) {
  if(props.gameOver) {
    if(props.userRematch) {
      return <HoverDiv
        innerHTML={"Rematch offered"}
        innerHTMLHover={"Cancel rematch"}
        className={"readyvert online"}
        classNameHover={"readyvert offline"}
      />
    } else if(props.opponentRematch) {
      return <HoverDiv
        innerHTML={"Accept rematch?"}
        innerHTMLHover={"Accept rematch?"}
        className={"readyvert offline"}
        classNameHover={"readyvert online"}
        onClick={props.offerRematch}
      />
    } else {
      return <HoverDiv
        innerHTML={"Offer rematch?"}
        innerHTMLHover={"Offer rematch?"}
        className={"readyvert offline"}
        classNameHover={"readyvert online"}
        onClick={props.offerRematch}
      />
    }
  }
  if(props.userReady) {
    return <div className="readyvert online">
      I'm ready!
    </div>
  }
  return <HoverDiv
    innerHTML={"Start the game"}
    innerHTMLHover={"Ready?"}
    className={"readyvert offline"}
    classNameHover={"readyvert online"}
    onClick={props.onReady}
  />
}

/**
 * Requires the same props as GameDesktop.
 */
function GameMobile(props) {
  let lag = props.lagMax ? props.lagMax : 0;
  let now = Date.now() - lag;
  let boardProps = getBoardProps(props, now);
  let elixirAmount = computeElixirAmount(props, now);
  return <div>
    <HeaderRow />
    <div>
      <div className="infoRow">
        <InfoBar user={props.opponent} elo={props.opponentElo} />
        <OpponentReadyButton {...props} />
      </div>
      <div className="chessboardvert">
        <BoardView
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
      </div>
      <div className="resourcebarvert">
        <ResourceBar 
          amount={elixirAmount} 
          animate={props.userReady && props.opponentReady && !props.gameOver}
        />
      </div>
      <div className="infoRow">
        <InfoBar user={props.user} elo={props.userElo} />
        <UserReadyButton {...props} />
      </div>
      <div className="ctrlRow">
        <LowerLeftControl {...props} />
        <LowerRightControl {...props} />
      </div>
    </div>
    <div className="consolevert">
      <ChatBox
        messages={props.chat}
        sendMessage={props.sendMessage}
        loginType={props.loginType}
      />
    </div>
  </div>
}

export {GameMobile}
