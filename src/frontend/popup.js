
import ReactDOM from "react-dom/client";
import "./popup.css";

function FakeInner(props) {
  return <div style={{
    fontSize: "max(5vw, 2rem)",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "yellow",
  }}>
    Hello World!
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("popup_window"));

function PopUp(props) {
  let button_row = [];
  let options = props.options;
  for(let {inner, onClick} of props.options) {
    let className = button_row.length ? "optionbutton" : "optionbutton first";
    button_row.push(<button
      className={className}
      onClick={() => {onClick(); hidePopUp();}}
    >
      {inner}
    </button>);
  }
  return <div className="popup">
    {props.inner}
    <div className="optionrow">
      {button_row}
    </div>
  </div>
}

function renderPopUp(inner, options) {
  root.render(<PopUp inner={inner} options={options} />);
}

function hidePopUp() {
  root.render(<div></div>);
}

export {renderPopUp, hidePopUp}

