
import React from "react";
import ReactDOM from "react-dom/client";
import "./video.css";
import "./slider.css";

/**
 * Unit video elements such as FakeVideo are required to take props:
 *   [progress] ([0, 1]): how much of the video is already played
 *   [playing] (bool): whether the video is currently playing
 */
function FakeVideo(props) {
  let style = {
    animationDuration: "10000ms",
    animationDelay: -props.progress * 10000 + "ms",
    animationPlayState: props.playing ? "running" : "paused",
  }
  return <div key={style.animationDelay} className="square" style={style}></div>
}

class UnitVideoPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      progress: 0,
      animationDuration: 10000,
      mouseDown: false,
      mouseDownX: 0,
      mouseCurrentX: 0,
    }
    window.addEventListener("mousemove", (e) => {this.onMouseMove(e.clientX)});
    window.addEventListener("mouseup", (e) => {this.onMouseUp()});
  }
  computeProgress() {
    let output = this.state.progress;
    if(this.state.mouseDown) {
      let rect = this.state.target.getBoundingClientRect();
      output += (this.state.mouseCurrentX - this.state.mouseDownX) / (rect.right - rect.left);
    }
    if(output > 1) return 1;
    if(output < 0) return 0;
    return output;
  }
  onMouseDown(x, target) {
    this.pause();
    let rect = target.getBoundingClientRect();
    let progress = (x - rect.left) / (rect.right - rect.left);
    this.setState({
      mouseDown: true,
      mouseDownX: x,
      target: target,
      mouseCurrentX: x,
      progress: progress,
    });
  }
  onMouseMove(x) {
    if(!this.state.mouseDown) return;
    this.setState({
      mouseCurrentX: x,
    });
  }
  onMouseUp(x) {
    if(!this.state.mouseDown) return;
    this.setState({
      mouseDown: false,
      progress: this.computeProgress(),
    });
  }
  play() {
    if(this.state.playing) return;
    this.setState({
      playing: true,
      playStartTime: Date.now(),
    });
  }
  pause() {
    if(!this.state.playing) return;
    let now = Date.now();
    let new_progress = this.state.progress + (now - this.state.playStartTime) / this.state.animationDuration;
    this.setState({
      progress: new_progress,
      playing: false,
    });
  }
  render() {
    console.log("render");
    console.log("state progress: " + this.state.progress);
    let playing = this.state.playing && !this.state.mouseDown;
    let progress = this.computeProgress();
    console.log("actual progress: " + progress);
    let animationState = {
      animationPlayState: playing ? "running" : "paused",
      animationDuration: this.state.animationDuration + "ms",
      animationDelay: -progress * this.state.animationDuration + "ms",
    }
    return <div>
      <FakeVideo playing={playing} progress={progress} />
      <div className="progressBox">
        <div key={playing + "point" + progress}
          className="progressPoint" style={animationState}></div>
        <div key={playing + "bar" + progress}
          className="progressBar" style={animationState}></div>
        <div className="progressBackground"
          onMouseDown={e => this.onMouseDown(e.clientX, e.target)}
        ></div>
      </div>
      <button onClick={() => this.play()}>Play</button>
      <button onClick={() => this.pause()}>Pause</button>
    </div>
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<UnitVideoPlayer />);
