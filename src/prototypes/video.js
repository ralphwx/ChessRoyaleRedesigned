import ReactDOM from "react-dom/client";
import React from "react";
import "./video.css";
import {Slider} from "./slider.js";

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startTime: undefined,
      progress: 0,
      finalTime: 10000,
      playing: false,
    }
  }
  positionUpdate(progress) {
    this.setState({
      startTime: Date.now(),
      progress: progress,
    });
  }
  play() {

  }
  pause() {

  }
  render() {
    let playState = this.state.playing ? "running" : "paused";
    let playStyle = {
      animationDuration: this.state.finalTime + "ms",
      animationPlayState: playState,
    };
    return <div style={{transform: "translate(200px, 100px)"}}>
      <div className={"square"} style={playStyle}></div>
      <Slider progress={this.state.progress} 
        subscribers={[(prog) => {this.positionUpdate(prog)}]} 
        playing={this.state.playing}
        animationDuration={this.state.finalTime}
      />
      <button onClick={() => {this.setState({playing: true})}}>Play</button>
      <button onClick={() => {this.setState({playing: false})}}>Pause</button>
    </div>
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
