import {ARROW_TIME, ELIXIR, Color, LoginType} from "../data/enums.mjs";
import {BoardView} from "./boardview.js";
import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";

let play = "/play.png";
let pause = "/pause.png";

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

function computeBoardProps(gamedata, now) {
  let statePointer = gamedata.history;
  while(!statePointer.tail.isNil() && statePointer.head.currentTime > now) {
    statePointer = statePointer.tail;
  }
  let board = statePointer.head.boardHistory.head;
  let delay = statePointer.head.delay;
  let moveArrows = [];
  let movePointer = statePointer.head.moveHistory;
  while(!movePointer.isNil() && movePointer.head.time >= now - ARROW_TIME) {
    moveArrows.push(movePointer.head);
    movePointer = movePointer.tail;
  }
  return {
    board: board,
    delay: delay,
    moveArrows: moveArrows,
    wElixir: (now - statePointer.head.wStart) / ELIXIR,
    bElixir: (now - statePointer.head.bStart) / ELIXIR,
  }
}

function PlayButton(props) {
  if(props.playing) {
    return <button
      className="controlbutton middle"
      onClick={props.onPause}
      title={"Pause"}
    >
      <img src={pause} className="playimg" alt="||" />
    </button>
  }
  return <button
    className="controlbutton middle"
    onClick={props.onPlay}
    title={"Play"}
  >
    <img src={play} className="playimg" alt="|>" />
  </button>
}

/**
 * Same props as ReplayDesktop
 */
function ReplayMobile(props) {
  let animationState = {
    animationDuration: props.duration + "ms",
    animationDelay: -props.progress * props.duration + "ms",
    animationPlayState: props.playing ? "running" : "paused",
  };
  let boardProps = computeBoardProps(props.gamedata, props.now);
  let boardview = <BoardView
    now={props.now}
    animateBoth={true}
    color={props.color}
    board={boardProps.board}
    delay={boardProps.delay}
    squareType={props.squareType}
    onMouseDown={(r, c, x, y, b) => {props.onMouseDownBoard(r, c, x, y, b)}}
    onMouseUp={(r, c, x, y) => {props.onMouseUpBoard(r, c, x, y)}}
    onMouseMove={() => {}}
    translate={props.translate}
    moveArrows={boardProps.moveArrows}
    userArrows={props.userArrows}
    freezeFrame={!props.playing}
  />
  let userElixir = props.color === Color.WHITE ? boardProps.wElixir :
    boardProps.bElixir;
  let opponentElixir = props.color === Color.WHITE ? boardProps.bElixir :
    boardProps.wElixir;
  return <div>
    <HeaderRow loginType={LoginType.REPLAY}/>
    <div className="contentcontainerreplayvert">
      <div className="infoRowReplay">
        <InfoBar user={props.opponent} elo={props.opponentElo} />
      </div>
      <div className="resourcebarreplayvert">
        <ResourceBar
          amount={opponentElixir}
          animate={props.playing}
        />
      </div>
      <div className="chessboardreplayvert">
        {boardview}
      </div>
      <div className="resourcebarreplayvert">
        <ResourceBar
          amount={userElixir}
          animate={props.playing}
        />
      </div>
      <div className="infoRowReplay">
        <InfoBar user={props.user} elo={props.userElo} />
      </div>
      <div className="replayBarContainervert">
        <div className="replayBarBackground"
          onMouseDown={(e) => {props.onMouseDownBar(e.clientX, e.target)}}
        ></div>
        <div key={props.progress + "bar"} 
          className="replayBarProgress" style={animationState}
        ></div>
        <div key={props.progress + "point"}
          className="replayBarPointer" style={animationState}
        ></div>
      </div>
      <div className="ctrlRowReplay">
        <button className="controlbutton"
          onClick={props.onPrevFrame}
          title={"rewind 0.1s"}
        >
          {"<"}
        </button>
        <PlayButton playing={props.playing} onPlay={props.onPlay} 
          onPause={props.onPause} />
        <button className="controlbutton"
          onClick={props.onNextFrame}
          title={"fast forward 0.1s"}
        >
          {">"}
        </button>
      </div>
    </div>
  </div>
}

export {ReplayMobile}
