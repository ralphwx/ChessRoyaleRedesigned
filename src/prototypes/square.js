import ReactDOM from "react-dom/client";
import "./square.css";

function Square(props) {
  return <div style={{width: "100px", height: "100px"}}>
    <div className="trigger" onMouseDown={() => console.log("hi")}></div>
    <div className="content">Hi</div>
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Square />);
