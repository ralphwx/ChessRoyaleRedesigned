import React from "react";

/**
 * Class that dynamically updates the display depending on whether the screen
 * view is horizontal or vertical.
 * Ratio is the window width to window height ratio at which to transition
 * from horizontal to vertical or vice versa. Default value is 1
 */
class DynamicDisplay extends React.Component {
  static getDerivedStateFromProps(props, state) {
    if(props.innerHTMLHorizontal === state.innerHTMLHorizontal
      && props.innerHTMLVertical === state.innerHTMLVertical
      && Math.abs(props.ratio - state.ratio) < 0.0001) {
      return null;
    }
    return {
      innerHTMLHorizontal: props.innerHTMLHorizontal,
      innerHTMLVertical: props.innerHTMLVertical,
      ratio: props.ratio,
    };
  }

  constructor(props) {
    super(props);
    let ratio = props.ratio;
    if(ratio === undefined) ratio = 1;
    let display = window.innerWidth <= ratio * window.innerHeight ?
      "vertical" : "horizontal";
    //console.log(display);
    this.state = {
      innerHTMLHorizontal: props.innerHTMLHorizontal,
      innerHTMLVertical: props.innerHTMLVertical,
      display: display,
      ratio: ratio,
    }
    this.handler = () => this.handleResize();
  }
  handleResize() {
    //console.log("called resize");
    if(window.innerWidth > this.state.ratio * window.innerHeight) {
      if(this.state.display === "vertical") {
        //console.log("called re-render");
        this.setState({display: "horizontal"});
      }
    } else {
      if(this.state.display === "horizontal") {
        //console.log("called re-render");
        this.setState({display: "vertical"});
      }
    }
  }
  componentDidMount() {
    window.addEventListener("resize", this.handler);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handler);
  }
  render() {
    //console.log(this.state.display);
    if(this.state.display === "vertical") {
      return <div>{this.state.innerHTMLVertical}</div>
    } else {
      return <div>{this.state.innerHTMLHorizontal}</div>
    }
  }
}

export {DynamicDisplay}
