
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./frontend/controller3.mjs";
import {GameModel} from "./frontend/game_model.mjs";
import {connect} from "./frontend/metaauthclient.mjs";
import {URL, LoginType, GameOverCause, Color} from "./data/enums.mjs";
import {GameDesktop} from "./frontend/game_desktop.js";
import {renderPopUp} from "./frontend/popup.js";

import "./frontend/index.css";


//assert loginType === LoginType.LOGIN

function getMessage(result, cause) {
  if(cause === GameOverCause.ABORT) {
    return "Game aborted";
  }
  if(cause === GameOverCause.AGREE) {
    return "Drawn by agreement";
  }
  let messagePrefix;
  if(result === Color.WHITE) messagePrefix = "White wins by ";
  else if(result === Color.BLACK) messagePrefix = "Black wins by ";
  else throw new Error("What else could cause a draw?");
  
  if(cause === GameOverCause.KING) {
    return messagePrefix + "king capture";
  }
  return messagePrefix + "resignation";
}

/**
 * Component displaying the game over message. Props should have properties:
 *   [gameOverResult] (Color): describes which side won the game
 *   [gameOverCause] (GameOverCause): describes how the game ended
 */
function GameOverMessage(props) {
  let message = getMessage(props.gameOverResult, props.gameOverCause);
  return <div className={"gameOverMessage"}>
    {message}
  </div>
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {...props};
    let refreshView = () => {
      let state = props.controller.getViewState();
      this.setState(state);
    };
    
    props.controller.addListener({
      boardUpdated: refreshView,
      chatUpdated: refreshView,
      metaUpdated: refreshView,
      gameStarted: refreshView,
      gameOver: (result, cause) => {
        refreshView();
        setTimeout(() => {
          renderPopUp(<GameOverMessage 
            gameOverResult={result} 
            gameOverCause={cause} 
          />,
          [{inner: "Okay", onClick:() => {}}]);
        }, 500);
      }
    });
    setInterval(() => {this.setState({});}, 100);
  }
  render() {
    return <GameDesktop {...this.state} />
  }
}

let user = "Guest#1";
let psw = undefined;
let loginType = LoginType.GUEST;

if(loginType === undefined) {
  //redirect
}

connect(URL, user, psw, loginType, (socket) => {
  socket.addEventHandler("joined", (meta, args) => {
    window.location.reload(true);
  });
  socket.notify("redirect?", {}, (meta, args) => {
    if(args !== Location.GAME) {
      //redirect
    }
  });
  let user = socket.user;
  let model = new GameModel(user, socket);
  let controller = new Controller(model);
  let view = <Game {...controller.getViewState()} controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view);
}, (msg) => {
  //redirect
});
