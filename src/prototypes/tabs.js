
import React from "react";
import ReactDOM from "react-dom/client";
import "./frontend/index.css";

/**
 * Tabs provides tabs, oriented at the top, that displays any number of
 * windows. Takes [labels] and [windows] as inputs, where
 *   - [labels] is a list of display elements for the tabs
 *   - [windows] is a list of corresponding display windows
 */
class Tabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      i: 0,
    }
    this.labels = props.labels;
    this.windows = props.windows;
  }
  renderLabels() {
    let output = [];
    let borderStyle = {
      borderBottom: "2px solid black",
    };
    for(let i = 0; i < this.labels.length; i++) {
      if(i === this.state.i) {
        output.push(<div 
          className={"tab tabselect"} 
          onClick={() => {this.setState({i: i})}}
        >{this.labels[i]}</div>);
      } else {
        output.push(<div 
          className={"tab"} 
          onClick={() => {this.setState({i: i})}}
        >{this.labels[i]}</div>);
      }
    }
    return output;
  }
  renderWindow() {
    return this.windows[this.state.i];
  }
  render() {
    return <div style={{backgroundColor: "lightgray"}}>
      <div className={"tabs"}>
        {this.renderLabels()}
      </div>
      <div className={"tabwindow"}>{this.renderWindow()}</div>
    </div>
  }
}


let labels = [
  "red",
  "green",
  "blue",
];

let windows = [
  <div style={{width:"100%", height: "500px", backgroundColor: "red"}}></div>,
  <div style={{width:"100%", height: "500px", backgroundColor: "green"}}></div>,
  <div style={{width:"100%", height: "500px", backgroundColor: "blue"}}></div>,
];

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Tabs labels={labels} windows={windows} />);
