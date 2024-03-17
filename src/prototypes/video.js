import ReactDOM from "react-dom/client";
import React from "react";
import "./video.css";

class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      animationDuration: props.animationDuration,
      animationDelay: props.animationDelay,
      playing: props.playing,
      playStartTime: Date.now(),
      md: false,
      mdx: undefined,
      mdy: undefined,
      mcx: undefined,
      mcy: undefined,
    }
    this.onPositionChange = props.onPositionChange;
  }
  onMouseDown(x, y) {
    this.setState({
      md: true,
      mdx: x,
      mdy: y,
      mcx: x,
      mcy: y,
    });
  }
  onMouseUp(x, y) {
    this.setState({
      md: false,
    });
  }
  onMouseMove(x, y) {
    this.setState({
      mcx: x,
      mcy: y,
    });
  }
  computePosition() {
    return this.state.animationDelay
  }
  render() {
    let playStyle = {
      animationDuration: this.state.animationDuration,
      animationDelay: this.state.animationDelay,
      animationPlayState: this.state.playing ? "running" : "paused",
    }
    return <div className="progressBox">
      <div className="progressPoint" style={playStyle}></div>
      <div className="progressBar" style={playStyle}></div>
      <div className="progressBackground"></div>
    </div>
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startTime: undefined,
      currentTime: 0,
      finalTime: 10000,
      playing: false,
    }
  }
  render() {
    let playState = this.state.playing ? "running" : "paused";
    let playStyle = {
      animationDuration: this.state.finalTime + "ms",
      animationPlayState: playState,
    };
    return <div style={{transform: "translate(200px, 100px)"}}>
      <div className={"square"} style={playStyle}></div>
      <div style={{border: "2px solid black", width: "300px", position: "relative"}}>
        <div className="progressPoint" style={playStyle}></div>
        <div className="progressBar" style={playStyle}></div>
        <div className="progressBackground"></div>
      </div>
      <button onClick={() => {this.setState({playing: true})}}>Play</button>
      <button onClick={() => {this.setState({playing: false})}}>Pause</button>
    </div>
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
