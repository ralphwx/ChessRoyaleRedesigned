
import React from "react";
import ReactDOM from "react-dom/client";
import "./slider.css";

class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: props.progress,
      mouseDown: false,
      mouseDownX: 0,
      mouseCurrentX: 0,
      id: props.id,
    }
    this.positionListeners = props.subscribers;
    console.log("Called constructor");
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
    if(!this.state.mouseDown) return;
    this.setState({
      mouseDown: false,
      progress: this.computeProgress(),
    });
    for(let listener of this.positionListeners) {
      listener(this.computeProgress());
    }
  }
  onMouseMove(x) {
    console.log("on mouse move");
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
    return rect.right - rect.left;
  }
  render() {
    let progressBarWidth = {
      width: (this.computeProgress() * 100) + "%",
    }
    console.log("computed width: " + progressBarWidth.width);
    let progressPointStyle = {
      left: "calc(" + (this.computeProgress() * 100) + "% - 14px)",
    }
    return <div className="progressBox" id={this.state.id}>
      <div className="progressPoint" style={progressPointStyle}
        onMouseDown={() => console.log("mouse down on point")}></div>
      <div className="progressBar" style={progressBarWidth} ></div>
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
        (progress) => {this.setState({progress: progress})}]} />
      <div>
        Progress: {rounded}
      </div>
    </div>
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
