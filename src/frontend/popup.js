
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
  for(let settings of options) {
    let className = button_row.length ? "optionbutton" : "optionbutton first";
    button_row.push(<button
      className={className}
      onClick={() => {
        settings.onClick(); 
        if(!settings.preventDefault) hidePopUp();
      }}
    >
      {settings.inner}
    </button>);
  }
  return <div className="popup">
    <div className="popupcontent">
    {props.inner}
    </div>
    <div className="optionrow">
      {button_row}
    </div>
  </div>
}

/**
 * Shows a pop-up window with inner contents [inner] and option buttons
 * [options]. [inner] has type JSX, while [options] is a list of 
 * {inner (JSX), onClick (() => (None))} objects.
 *
 * Each option button will display [inner] and call [onClick] when clicked.
 * Recommended to have at least one button in [options], otherwise the user
 * has no built-in way to close the pop-up.
 */
function renderPopUp(inner, options) {
  root.render(<PopUp inner={inner} options={options} />);
}

/**
 * Hides the pop-up window, if it's showing.
 */
function hidePopUp() {
  root.render(<div></div>);
}

export {renderPopUp, hidePopUp}

