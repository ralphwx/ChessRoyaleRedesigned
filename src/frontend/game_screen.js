
import React from "react";
import {Controller} from "./controller.mjs";
import {URL, LoginType, GameOverCause, Color} from "../data/enums.mjs";
import {GameDesktop} from "./game_desktop.js";
import {renderPopUp} from "./popup.js";

import "./index.css";


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

/**
 * Game component renders the game screen. Takes [controller] as the sole
 * input and relies on controller to provide all other view related state
 * and notify this component of changes.
 */
class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.controller.getViewState();
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
  }
  render() {
    return <GameDesktop {...this.state} />
  }
}

export {Game}
