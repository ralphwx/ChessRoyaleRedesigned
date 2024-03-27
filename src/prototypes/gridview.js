import ReactDOM from "react-dom/client";
import b_pawn from "../frontend/img/b_pawn.png";

let img = <img src={b_pawn} style={{width: "100%", height: "100%", border: "2px dashed blue"}}/>;
function GridView(props) {
  let square = {width: "33.3%", height: "100%", border:"1px solid black"};
  let row = {width: "100%", height: "33.3%", border:"1px dotted green", display: "flex", flexDirection: "row"};
  return <div style={{width: "90vmin", height: "90vmin"}}>
    <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
      {[<div style={row}>{[<div style={square}>{img}</div>, <div style={square}></div>, <div style={square}></div>]}</div>,
      <div style={row}>{[<div style={square}></div>, <div style={square}></div>, <div style={square}></div>]}</div>,
      <div style={row}>{[<div style={square}></div>, <div style={square}></div>, <div style={square}></div>]}</div>,
      ]}
    </div>
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<GridView />);
