import ReactDOM from "react-dom/client";

import {HeaderRow} from "./header.js";
import {ResourceBar} from "./resourcebar.js";
import {ChatBox} from "./chatbox.js";
import {Color, LoginType} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap} from "../data/maps.mjs";
import {BoardView} from "./boardview.js";

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

function ReplayDesktop(props) {
  let boardview = <BoardView
    now={Date.now()}
    color={Color.WHITE}
    board={ChessBoard.startingPosition()}
    delay={ChessMap.fromDefault(0)}
    squareType={ChessMap.fromInitializer((r, c) => {
      if((r + c) & 1) return "odd";
      return "even";
    })}
    onMouseDown={() => {}}
    onMouseUp={() => {}}
    onMouseMove={() => {}}
    translate={ChessMap.fromInitializer(() => {return [0, 0]})}
    moveArrows={[]}
    userArrows={[]}
  />
  return <div>
    <HeaderRow username={"streamer1"} loginType={undefined} />
    <div className="gamecontainer">
      <div>
        {boardview}
        <div className="resourcebar">
          <ResourceBar
            amount={3.14}
            animate={false}
          />
        </div>
      </div>
      <div className="metabox">
        <InfoBar user={"Random Noob"} elo={100} />
        <OpponentReadyButton />
        <div>
          <ChatBox
            messages={[]}
            loginType={LoginType.SPECTATE}
          />
        </div>
        <UserReadyButton />
        <InfoBar user={"Pot of Queens sub"} elo={9999} />
        <div className="gamectrl">
          <button className="controlbutton">
            {"<"}
          </button>
          <button className="controlbutton middle">
            {"|>"}
          </button>
          <button className="controlbutton">
            {">"}
          </button>
        </div>
      </div>
    </div>
    <div className="replayBarContainer">
      <div className="replayBarBackground"></div>
      <div className="replayBarProgress" style={{
        animationDuration: "10000ms",
        animationDelay: "-2000ms",
        animationPlayState: "paused"
      }}></div>
      <div className="replayBarPointer" style={{
        animationDuration: "10000ms",
        animationDelay: "-2000ms",
        animationPlayState: "paused",
      }}></div>
    </div>
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ReplayDesktop />);
