import React from "react";

/**
 * Renders a button that displays different HTML depending on whether the
 * user is hovering over it
 */
export class HoverButton extends React.Component {
  static getDerivedStateFromProps(props, state) {
    if(props.innerHTML === state.innerHTML
      && props.innerHTMLHover === state.innerHTMLHover
      && props.className === state.className
      && props.classNameHover === state.classNameHover
      && props.onClick === state.onClick
    ) {
      return null;
    }
    return {
      innerHTML: props.innerHTML,
      innerHTMLHover: props.innerHTMLHover,
      className: props.className,
      classNameHover: props.classNameHover,
      onClick: props.onClick
    };
  }
  constructor(props) {
    super(props);
    this.state = {
      innerHTML: props.innerHTML,
      innerHTMLHover: props.innerHTMLHover,
      className: props.className,
      classNameHover: props.classNameHover,
      hover: false,
      onClick: props.onClick,
    }
  }
  render() {
    if(this.state.hover) {
      return <button 
        className={this.state.classNameHover} 
        onMouseLeave={() => {this.setState({hover: false});}}
        onClick={this.state.onClick}
      >
        {this.state.innerHTMLHover}
      </button>
    }
    return <button
      className={this.state.className}
      onMouseEnter={() => {this.setState({hover: true})}}
      onClick={this.state.onClick}
    >
      {this.state.innerHTML}
    </button>
  }
}
