import ReactDOM from "react-dom/client";
import b_pawn from "../frontend/img/b_pawn.png";
import "./countdown.css";
let pawn_img = <img src={b_pawn} alt="?" />

function Main(props) {
  return <div style={{
    width: "100px", 
    height: "100px",
    backgroundColor: "orange",
    transform: "translate(100px, 100px)",
  }}>
    <div style={{
      marginLeft: "auto",
      marginRight: "auto",
    }}>
      {pawn_img}
    </div>
    <svg style={{
      position: "absolute",
      top: "0",
      left: "0",
      border: "1px green dotted",
      width: "100%",
      height: "100%",
    }}>
      <circle r="46%" cx="50%" cy="50%" className="circle" style={{
        animationDelay: "-2000ms",
        animationDuration: "2000ms",
        fill: "none",
      }}></circle>
    </svg>
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
