
import React from "react";

import img_null from "./img/null.png";
import w_pawn from "./img/w_pawn.png";
import w_rook from "./img/w_rook.png";
import w_knight from "./img/w_knight.png";
import w_bishop from "./img/w_bishop.png";
import w_queen from "./img/w_queen.png";
import w_king from "./img/w_king.png";
import b_pawn from "./img/b_pawn.png";
import b_rook from "./img/b_rook.png";
import b_knight from "./img/b_knight.png";
import b_bishop from "./img/b_bishop.png";
import b_queen from "./img/b_queen.png";
import b_king from "./img/b_king.png";
import "./index.css";

import Xarrow from "react-xarrows";
import {colorOf, Color, Piece, DELAY} from "../data/enums.mjs";

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
  return <img className="chesspiece" src={src} alt="?"/>;
}

function computeOpacity(props, r, c, now) {
  if(colorOf(props.board.pieceAt(r, c)) !== props.color
    || now - props.delay.get(r, c) >= DELAY) return 1;
  return 0.2 + 0.5 * (now - props.delay.get(r, c)) / DELAY;
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
 *   color: Color
 *   board: ChessBoard
 *   delay: ChessMap<time>
 *   squareType: ChessMap<SquareType>
 *   onMouseDown: (row, col, pixelX, pixelY, button) => (None)
 *   onMouseUp: (row, col, pixelX, pixelY) => (None)
 *   onMouseMove: (pixelX, pixelY) => (None)
 *   translate: ChessMap<[dx, dy]>
 *   moveArrows: list of {iRow, iCol, fRow, fCol, time, color} objects
 *   userArrows: list of {iRow, iCol, fRow, fCol} objects
 */
function BoardView(props) {
  let now = Date.now();
  let squares = [];
  let squareType = props.squareType;
  let translate = props.translate;
  for(let i = 0; i < 8; i++) {
    let row = [];
    for(let j = 0; j < 8; j++) {
      let r = props.color === Color.WHITE ? 7 - i : i;
      let c = props.color === Color.WHITE ? j : 7 - j;
      let img = pieceToHTML(props.board.pieceAt(r, c));
      let opacity = computeOpacity(props, r, c, now);
      let type = squareType.get(r, c);
      let [dx, dy] = translate.get(r, c);
      row.push(<div key={r + "_" + c}><Square 
        img={img} 
        type={type} 
        id={r + "_" + c}
        opacity={opacity}
        translateX={dx}
        translateY={dy}
        onMouseDown={(x, y, b) => props.onMouseDown(r, c, x, y, b)}
        onMouseUp={(x, y) => props.onMouseUp(r, c, x, y)}
        onMouseMove={(x, y) => props.onMouseMove(x, y)}
      /></div>);
    }
    squares.push(<div key={i} className="gridrow">{row}</div>);
  }
  let arrows = [];
  for(let move of props.moveArrows) {
    //let opacity = (DELAY / 2 - now + move.time) / DELAY * 2;
    let opacity = 0.7;
    let start = move.iRow + "_" + move.iCol;
    let end = move.fRow + "_" + move.fCol;
    arrows.push(<div style={{opacity: opacity}}>
      <Xarrow
        start={start}
        end={end}
        path={"straight"}
        startAnchor={"middle"}
        endAnchor={"middle"}
        color={colorToHex(move.color)}
        strokeWidth={10}
        headSize={4}
        zIndex={5}
      />
    </div>);
  }
  for(let move of props.userArrows) {
    let start = move.iRow + "_" + move.iCol;
    let end = move.fRow + "_" + move.fCol;
    arrows.push(<div key={start+end}><Xarrow
      start={start}
      end={end}
      path={"straight"}
      startAnchor={"middle"}
      endAnchor={"middle"}
      color={"#aef"}
      strokeWidth={5}
    /></div>);
  }
  return <div>
    <div>{squares}</div>
    <div>{arrows}</div>
  </div>
}

/**
 * Props is required to have:
 *   type: SquareType
 *   opacity: [0, 1]
 *   onMouseDown: (pixelX, pixelY, button) => (None)
 *   onMouseUp: (pixelX, pixelY) => (None)
 *   onMouseMove: (pixelX, pixelY) => (None)
 *   img: JSX
 *   translateX: double
 *   translateY: double
 */
function Square(props) {
  let translateStyle = {
    transform: "translate(" + props.translateX + "px, " + props.translateY + "px)",
    opacity: props.opacity,
  };
  let zStyle = {
    zIndex: props.translateX || props.translateY ? 1 : 0,
  }
  return <div id={props.id} className={"squarecontainer"} style={zStyle}>
    <div className={"squaretrigger " + props.type} 
      style={{opacity: props.opacity}}
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
    <div className={"square"} style={translateStyle}>{props.img}</div>
  </div>
}

export {BoardView}
