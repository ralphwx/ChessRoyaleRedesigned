
import ReactDOM from "react-dom/client";
import "./frontend/popup.css";

function PopUp(props) {
  return <div className="popup" style={{
    width: "50%",
    height: "50%",
    backgroundColor: "#aaa",
  }}>
    <div style={{
      fontSize: "max(5vw, 2rem)",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "yellow",
    }}>
      Hello World!
    </div>
    <div style={{
      position: "absolute",
      bottom: "0",
      width: "100%",
      height: "max(3.5vw, 3.5rem)",
      backgroundColor: "#777",
      display: "flex",
    }}>
      <button style={{
        fontSize: "max(2vw, 2rem)",
        margin: "max(0.5vw, 0.5rem)",
        marginLeft: "auto",
      }}>Okay</button>
      <button style={{
        fontSize: "max(2vw, 2rem)",
        margin: "max(0.5vw, 0.5rem)",
      }}>Cancel</button>
    </div>
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<PopUp />);
