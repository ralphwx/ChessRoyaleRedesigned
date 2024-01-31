import React from "react";

/**
 * DynamicDisplay displays one of two things, depending on whether the display
 * window is horizontal or vertical. 
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

  /**
   * Constructs a DynamicDisplay instance. props is required to have properties:
   *   - innerHTMLHorizontal: the JSX to display when the window is horizontal
   *   - innerHTMLVertical: the JSX to display when the window is vertical
   * Props may also have an additional property [ratio], which is the window
   *   width to window height ratio at which the window transitions between
   *   vertical and horizontal.
   */
  constructor(props) {
    super(props);
    let ratio = props.ratio;
    if(ratio === undefined) ratio = 1;
    let display = window.innerWidth <= ratio * window.innerHeight ?
      "vertical" : "horizontal";
    this.state = {
      innerHTMLHorizontal: props.innerHTMLHorizontal,
      innerHTMLVertical: props.innerHTMLVertical,
      display: display,
      ratio: ratio,
    }
    this.handler = () => this.handleResize();
  }
  handleResize() {
    if(window.innerWidth > this.state.ratio * window.innerHeight) {
      if(this.state.display === "vertical") {
        this.setState({display: "horizontal"});
      }
    } else {
      if(this.state.display === "horizontal") {
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
    if(this.state.display === "vertical") {
      return <div>{this.state.innerHTMLVertical}</div>
    } else {
      return <div>{this.state.innerHTMLHorizontal}</div>
    }
  }
}

export {DynamicDisplay}
