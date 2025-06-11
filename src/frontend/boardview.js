
import React from "react";

import Xarrow from "react-xarrows";
import {colorOf, Color, Piece, DELAY, ARROW_TIME} from "../data/enums.mjs";
import "./boardview.css";

let img_null = "/null.png";
let w_pawn = "/w_pawn.png";
let w_rook = "/w_rook.png";
let w_knight = "/w_knight.png";
let w_bishop = "/w_bishop.png";
let w_queen = "/w_queen.png";
let w_king = "/w_king.png";
let b_pawn = "/b_pawn.png";
let b_rook = "/b_rook.png";
let b_knight = "/b_knight.png";
let b_bishop = "/b_bishop.png";
let b_queen = "/b_queen.png";
let b_king = "/b_king.png";

function imgSrc(p) {
  switch(p) {
    case Piece.NULL: return img_null;
    case Piece.W_PAWN: return w_pawn;
    case Piece.W_ROOK: return w_rook;
    case Piece.W_KNIGHT: return w_knight;
    case Piece.W_BISHOP: return w_bishop;
    case Piece.W_QUEEN: return w_queen;
    case Piece.W_KING: return w_king;
    case Piece.B_PAWN: return b_pawn;
    case Piece.B_ROOK: return b_rook;
    case Piece.B_KNIGHT: return b_knight;
    case Piece.B_BISHOP: return b_bishop;
    case Piece.B_QUEEN: return b_queen;
    case Piece.B_KING: return b_king;
    default: throw new Error("Incomplete case match");
  }
}

function pieceToHTML(p) {
  let src = imgSrc(p);
  return <img className="innerimg" src={src} alt="?"/>;
}

function computeDelay(props, r, c, now) {
  if((!props.animateBoth
    && colorOf(props.board.pieceAt(r, c)) !== props.color)
    || now - props.delay.get(r, c) >= DELAY) return -DELAY;
  return props.delay.get(r, c) - now;
}

function colorToHex(color) {
  switch(color) {
    case Color.WHITE: return "#fff";
    case Color.BLACK: return "#aaa";
    default: throw new Error("Cannot convert null to color");
  }
}

/**
 * Props is required to have:
 *   animateBoth: bool (show both players' animations)
 *   color: Color (show the pieces from the perspective of [color]).
 *   board: ChessBoard
 *   delay: ChessMap<time>
 *   squareType: ChessMap<SquareType>
 *   onMouseDown: (row, col, pixelX, pixelY, button) => (None)
 *   onMouseUp: (row, col, pixelX, pixelY) => (None)
 *   onMouseMove: (pixelX, pixelY) => (None)
 *   translate: ChessMap<[dx, dy]>
 *   moveArrows: list of {iRow, iCol, fRow, fCol, time, color} objects
 *   userArrows: list of {iRow, iCol, fRow, fCol} objects
 *   now: the timestamp to be displayed
 *   freezeFrame (bool): whether the animations should be frozen
 */
function BoardView(props) {
  let now = props.now;
  let squares = [];
  let squareType = props.squareType;
  let translate = props.translate;
  for(let i = 0; i < 8; i++) {
    let row = [];
    for(let j = 0; j < 8; j++) {
      let r = props.color === Color.WHITE ? 7 - i : i;
      let c = props.color === Color.WHITE ? j : 7 - j;
      let img = pieceToHTML(props.board.pieceAt(r, c));
      let type = squareType.get(r, c);
      let [dx, dy] = translate.get(r, c);
      row.push(<div className="gridunit" key={r + "_" + c}><Square 
        img={img} 
        type={type} 
        id={r + "_" + c}
        animationDelay={computeDelay(props, r, c, now)}
        translateX={dx}
        translateY={dy}
        onMouseDown={(x, y, b) => props.onMouseDown(r, c, x, y, b)}
        onMouseUp={(x, y) => props.onMouseUp(r, c, x, y)}
        onMouseMove={(x, y) => props.onMouseMove(x, y)}
        freezeFrame={props.freezeFrame}
      /></div>);
    }
    squares.push(<div key={i} className="gridrow">{row}</div>);
  }
  let arrows = [];
  for(let move of props.moveArrows) {
    let start = move.iRow + "_" + move.iCol;
    let end = move.fRow + "_" + move.fCol;
    arrows.push(<div className={"fadearrow"} 
      onContextMenu={(e) => {e.preventDefault()}}
      key={"move" + start + end + now}
      style={{
        animationDuration: ARROW_TIME + "ms",
        animationDelay: (move.time - now) + "ms",
        animationPlayState: props.freezeFrame ? "paused" : "running",
      }}
    >
      <Xarrow
        start={start}
        end={end}
        path={"straight"}
        startAnchor={"middle"}
        endAnchor={"middle"}
        color={colorToHex(move.color)}
        strokeWidth={10}
        headSize={4}
        passProps={{pointerEvents: "none"}}
      />
    </div>);
  }
  for(let move of props.userArrows) {
    let start = move.iRow + "_" + move.iCol;
    let end = move.fRow + "_" + move.fCol;
    arrows.push(<div className={"arrow"} key={"user" + start + end}>
    <Xarrow
      start={start}
      end={end}
      path={"straight"}
      startAnchor={"middle"}
      endAnchor={"middle"}
      color={"#aef"}
      strokeWidth={5}
      passProps={{pointerEvents: "none"}}
    /></div>);
  }
  return <div className="fillparent">
    <div className="grid fillparent">{squares}</div>
    <div>{arrows}</div>
  </div>
}

/**
 * Props is required to have:
 *   type: SquareType
 *   animationDelay: negative the amount of time since piece on the square last
 *     moved, if relevant, -DELAY otherwise
 *   onMouseDown: (pixelX, pixelY, button) => (None)
 *   onMouseUp: (pixelX, pixelY) => (None)
 *   onMouseMove: (pixelX, pixelY) => (None)
 *   img: JSX
 *   translateX: double
 *   translateY: double
 *   freezeFrame: whether the animation should be frozen
 */
function Square(props) {
  let animationStyle = {
    animationDelay: props.animationDelay + "ms",
    animationDuration: DELAY + "ms",
    animationPlayState: props.freezeFrame ? "paused" : "running",
  }
  let translateStyle = Object.assign({
    transform: "translate(" + props.translateX + "px, " + props.translateY + "px)",
  }, animationStyle);
  let zStyle = {
    zIndex: props.translateX || props.translateY ? 1 : 0,
  }
  return <div id={props.id} className="squarecontainer" style={zStyle}>
    <div className={"overlay fillparent " + props.type} 
      key={props.key + props.animationDelay} 
      style={animationStyle}
      onContextMenu={e => e.preventDefault()}
      onMouseDown={e => {
        e.preventDefault(); 
        let box = e.currentTarget.getBoundingClientRect();
        let mx = (box.left + box.right) / 2;
        let my = (box.top + box.bottom) / 2;
        props.onMouseDown(mx, my, e.button);
      }}
      onMouseUp={e => {
        e.preventDefault(); 
        props.onMouseUp(e.clientX, e.clientY)
      }}
      onMouseMove={e => {
        e.preventDefault(); 
        props.onMouseMove(e.clientX, e.clientY)
      }}
    ></div>
    <div className="square fillparent" 
      key={props.animationDelay} 
      style={translateStyle}
    >
      {props.img}
    </div>
    <svg className="countdownwrapper" 
      key={"circle" + props.animationDelay}
    >
      <circle r="46%" cx="50%" cy="50%" className="countdown"
        style={animationStyle}></circle>
    </svg>
  </div>
}

export {BoardView}
