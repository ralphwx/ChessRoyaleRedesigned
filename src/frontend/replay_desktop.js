
import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";
import {Color, LoginType, ELIXIR, ARROW_TIME} from "../data/enums.mjs";
import {BoardView} from "./boardview.js";
import play from "./img/play.png";
import pause from "./img/pause.png";
import "./index.css";

function InfoBar(props) {
  if(props.elo) {
    return <div className={"info online"}>
      {props.user + " (" + props.elo + ")"}
    </div>
  }
  return <div className={"info online"}>
    {props.user}
  </div>
}

function UserReadyButton() {
  return <button className="ready online">{"I'm ready!"}</button>
}

function OpponentReadyButton() {
  return <button className="ready online">{"Opponent ready!"}</button>
}

/**
 * Given the full set of props, computes
 *   - board
 *   - delay
 *   - moveArrows
 *   - wElixir
 *   - bElixir
 */
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

function ChatBoxReplay(props) {
  return <div>
    <div className="consolereplay" id="chat">
      <div>{"[system]: Welcome to replay mode. Use the buttons below to start"
        + " the replay or click the Chess Royale log in the upper right to"
        + " return to the main lobby"}</div>
    </div>
    <div className="text_input_wrapper">
      <form>
        <input className="chat_input" type="text" disabled="disabled" value="Chat disabled for replays" />
      </form>
    </div>
  </div>
}

/**
 * Requires props:
 *   loginUser (string): The username of the user who's watching the replay
 *   color (Color): Color.WHITE, if watching from white's perspective,
 *     otherwise Color.BLACK.
 *   user (string): the username of the person whose playing [color]
 *   userElo (int or empty string): the elo of the person playing [color], or
 *     empty string if they were playing as guest
 *   opponent (string): the username of the opponent
 *   opponentElo (int or empty string): the elo of the opponent, or empty string
 *     if they were playing as guest
 *
 *   gamedata (GameData): a gamedata object representing the game that was
 *     played
 *   userArrows (list of {iRow, iCol, fRow, fCol}): arrows the user has drawn
 *     on the board
 *   squareType (ChessMap<SquareType>): a description of the display type of
 *     each square on the board
 *   translate (ChessMap<[dx, dy]>): a description of how much each chess piece
 *     on the board should be moved.
 *
 *   progress (float [0, 1]): how much of the replay has already been played
 *   playing (bool): whether the replay is currently playing
 *   now (long): the timestamp to display
 *   duration (long): the total length of the video in ms
 *   
 *   onMouseDownBoard ((r, c, x, y, b) => (None)): function to call when the
 *     mouse is pressed on the board
 *   onMouseUpBoard ((r, c, x, y) => (None)): function to call when the mouse
 *     is lifted while on the board
 *   onMouseDownBar ((x, target) => (None)): function to call when the mouse
 *     is pressed on the progress bar
 *   
 *   onNextFrame (() => (None)): function to call when the user requests the 
 *     next frame
 *   onPrevFrame (() => None): function to call when the user requests the
 *     previous frame
 *   onPlay (() => (None)): function to call when the user presses play
 *   onPause (() => (None)): function to call when the user presses pause
 */
function ReplayDesktop(props) {
  let animationState = {
    animationDuration: props.duration + "ms",
    animationDelay: -props.progress * props.duration + "ms",
    animationPlayState: props.playing ? "running" : "paused",
  }
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
  let userElixir = props.color === Color.WHITE ? boardProps.wElixir : boardProps.bElixir;
  let opponentElixir = props.color === Color.WHITE ? boardProps.bElixir: boardProps.wElixir;
  return <div>
    <HeaderRow username={props.loginUser} loginType={LoginType.REPLAY} />
    <div className="replayBox">
      <div className="headerbufferreplay"></div>
      <div className="gamecontainerreplay">
        <div>
          <div className="resourcebarreplay">
            <ResourceBar
              amount={opponentElixir}
              animate={props.playing}
              key={opponentElixir + "obar"}
            />
          </div>
          <div className="chessboardreplay">
            {boardview}
          </div>
          <div className="resourcebarreplay">
            <ResourceBar
              amount={userElixir}
              animate={props.playing}
              key={userElixir + "bar"}
            />
          </div>
        </div>
        <div className="metabox">
          <InfoBar user={props.opponent} elo={props.opponentElo} />
          <OpponentReadyButton />
          <div>
            <ChatBoxReplay />
          </div>
          <UserReadyButton />
          <InfoBar user={props.user} elo={props.userElo} />
          <div className="gamectrl">
            <button 
              className="controlbutton" 
              onClick={props.onPrevFrame}
              title={"rewind 0.1s"}
            >
              {"<"}
            </button>
            <PlayButton playing={props.playing} onPlay={props.onPlay} onPause={props.onPause} />
            <button 
              className="controlbutton" 
              onClick={props.onNextFrame}
              title={"fast foward 0.1s"}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
      <div className="replayBarContainer">
        <div 
          className="replayBarBackground" 
          onMouseDown={(e) => {props.onMouseDownBar(e.clientX, e.target)}}
        ></div>
        <div key={props.progress + "bar"} 
          className="replayBarProgress" style={animationState}
        ></div>
        <div key={props.progress + "point"} 
          className="replayBarPointer" style={animationState}
        ></div>
      </div>
    </div>
  </div>
}

export {ReplayDesktop}
