
import React from "react";
import ReactDOM from "react-dom/client";
import "./slider.css";

class Slider extends React.Component {
  static getDerivedStateFromProps(props,state) {
    if(props.progress === state.progress
      && props.id === state.id
      && props.playing === state.playing
      && props.animationDuration === state.animationDuration
    ) {
      return null;
    }
    return {
      progress: props.progress,
      id: props.id,
      playing: props.playing,
      animationDuration: props.animationDuration,
    }
  }
  constructor(props) {
    super(props);
    this.state = {
      progress: props.progress,
      mouseDown: false,
      mouseDownX: 0,
      mouseCurrentX: 0,
      id: props.id,
      playing: props.playing,
      animationDuration: props.animationDuration,
    }
    this.positionListeners = props.subscribers;
    window.addEventListener("mousemove", (e) => {this.onMouseMove(e.clientX)});
    window.addEventListener("mouseup", (e) => {this.onMouseUp()});
  }
  onMouseDown(x, target) {
    console.log("mouse down");
    let rect = target.getBoundingClientRect();
    this.setState({
      mouseDown: true,
      mouseDownX: x, 
      mouseCurrentX: x,
      target: target,
      progress: (x - rect.left) / (rect.right - rect.left),
    });
  }
  onMouseUp() {
    console.log("mouse up");
    if(!this.state.mouseDown) return;
    console.log("mouse up proper");
    this.setState({
      mouseDown: false,
      progress: this.computeProgress(),
    });
    for(let listener of this.positionListeners) {
      listener(this.computeProgress());
    }
  }
  onMouseMove(x) {
    console.log("mouse move");
    if(!this.state.mouseDown) return;
    this.setState({
      mouseCurrentX: x,
    });
    for(let listener of this.positionListeners) {
      listener(this.computeProgress());
    }
  }
  computeProgress() {
    let output = this.state.progress;
    console.log("progress: " + this.state.progress);
    console.log("current x: " + this.state.mouseCurrentX);
    console.log("down x: " + this.state.mouseDownX);
    if(this.state.mouseDown) {
      output += (this.state.mouseCurrentX - this.state.mouseDownX) / this.maxWidthPixels();
    }
    if(output > 1) return 1;
    if(output < 0) return 0;
    return output;
  }
  maxWidthPixels() {
    let element = this.state.target;
    let rect = element.getBoundingClientRect();
    console.log("computed width: " + (rect.right - rect.left));
    return rect.right - rect.left;
  }
  render() {
    let animationState = {
      animationPlayState: this.state.playing && !this.state.mouseDown ? "running" : "paused",
      animationDuration: this.state.animationDuration + "ms",
      animationDelay: -this.computeProgress() * this.state.animationDuration + "ms",
    }
    console.log("render slider");
    console.log("animation delay: " + animationState.animationDelay);
    return <div className="progressBox" id={this.state.id}>
      <div key={animationState.animationPlayState + "point"}
        className="progressPoint" style={animationState}></div>
      <div key={animationState.animationPlayState + "bar"}
        className="progressBar" style={animationState} ></div>
      <div className="progressBackground"
        onMouseDown={e => this.onMouseDown(e.clientX, e.target)}
      ></div>
    </div>
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
    }
  }
  render() {
    let rounded = Math.floor(this.state.progress * 100) / 100;
    return <div>
      <Slider progress={this.state.progress} subscribers={[
        (progress) => {this.setState({progress: progress})}]} 
        playing={false}
        animationDuration={10000}
      />
      <div>
        Progress: {rounded}
      </div>
    </div>
  }
}

export {Slider}
//const root = ReactDOM.createRoot(document.getElementById("root"));
//root.render(<Main />);
