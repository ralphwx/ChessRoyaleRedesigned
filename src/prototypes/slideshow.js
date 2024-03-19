
import {SlideshowController} from "./slideshow_controller.mjs";
import React from "react";
import ReactDOM from "react-dom/client";
import "./video.css";
import "./slider.css";

function FakeVideo(props) {
  let style = {
    animationDuration: props.animationDuration + "ms",
    animationDelay: -props.progress * props.animationDuration + "ms",
    animationPlayState: props.playing ? "running" : "paused",
  }
  if(props.progress > 0.5) {
    return <div key={style.animationDelay} className="redsquare" style={style}>
    </div>
  }
  return <div key={style.animationDelay} className="square" style={style}></div>
}

class Slideshow extends React.Component {
  constructor(props) {
    super(props);
    this.controller = props.controller;
    this.state = props.controller.getViewState();
    this.controller.addListener((state) => {this.setState(state)});
  }
  render() {
    let animationStyle = {
      animationDuration: this.state.animationDuration + "ms",
      animationDelay: -this.state.progress * this.state.animationDuration + "ms",
      animationPlayState: this.state.playing ? "running" : "paused",
    }
    return <div>
      <FakeVideo 
        animationDuration={this.state.animationDuration}
        progress={this.state.progress}
        playing={this.state.playing}
      />
      <div className="progressBox">
        <div 
          key={this.state.playing + "point" + this.state.progress} 
          style={animationStyle}
          className="progressPoint"
        ></div>
        <div
          key={this.state.playing + "bar" + this.state.progress}
          style={animationStyle}
          className="progressBar"
        ></div>
        <div className="progressBackground"
          onMouseDown={e => this.state.onMouseDown(e.clientX, e.target)}
        ></div>
      </div>
      <button onClick={() => this.state.onPlay()}>Play</button>
      <button onClick={() => this.state.onPause()}>Pause</button>
    </div>
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Slideshow controller={new SlideshowController([5000, 5000])} />);
