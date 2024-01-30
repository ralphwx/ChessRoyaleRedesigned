//To run this test, copy this file into src/index.js and run npm start. Test
//that the board reacts properly to user inputs.

import React from "react";
import ReactDOM from "react-dom/client";

import {Controller} from "./frontend/controller3.mjs";
import {BoardView} from "./frontend/boardview.js";

let controller = new Controller();

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.controller = props.controller;
    this.state = controller.getViewState();
    this.updateThread = setInterval(() => {this.setState(controller.getViewState())}, 100);
  }
  render() {
    return <BoardView
      color={this.state.color}
      board={this.state.board}
      delay={this.state.delay}
      squareType={this.state.squareType}
      onMouseDown={this.state.onMouseDown}
      onMouseUp={this.state.onMouseUp}
      onMouseMove={this.state.onMouseMove}
      translate={this.state.translate}
      moveArrows={this.state.moveArrows}
      userArrows={this.state.userArrows}
    />
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<div style={{width: "50%", height: "50%"}}>
  <Main controller={controller} />
</div>);
