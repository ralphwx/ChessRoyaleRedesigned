import {ChessMap} from "../data/maps.mjs";
import {Color, colorOf, MoveType, Piece} from "../data/enums.mjs";
import {computeCapturable} from "./compute_capturable.mjs";

function listLegalMoves(board, color) {
  return board.listLegalMoves(color);
}

function piece_value(piece) {
  switch(piece) {
    case Piece.NULL: return 0;
    case Piece.W_PAWN:
    case Piece.B_PAWN: return 1;
    case Piece.W_ROOK:
    case Piece.B_ROOK: return 5;
    case Piece.W_KNIGHT:
    case Piece.W_BISHOP:
    case Piece.B_KNIGHT: 
    case Piece.B_BISHOP: return 3;
    case Piece.W_QUEEN:
    case Piece.B_QUEEN: return 9;
    case Piece.W_KING:
    case Piece.B_KING: return 10;
    default: throw new Error("Incomplete case match: " + piece);
  }
}

//computing how close (r, c) is to the center of the board, with larger values
//meaning "closer"
function centrality(r, c) {
  let rr = r > 3 ? 7 - r : r;
  let cc = c > 3 ? 7 - c : c;
  return Math.min(rr, cc);
}

class CaptureTreeNode {
  //[color] represents whose move it is in the position
  //[value] represents the net captured material up to that point, positive
  //numbers favor white, negative numbers favor black.
  constructor(board, value, color, children, depth) {
    this.board = board;
    this.value = value;
    this.toMove = color;
    this.children = children;
    this.depth = depth;
  }
}

//Returns a list of CaptureTreeNodes for 
function listDescendents(node) {
  let moves = listLegalMoves(node.board, node.toMove);
  let output = [];
  let scale = node.toMove === Color.BLACK ? -1 : 1;
  let oppoColor = node.toMove === Color.BLACK ? Color.WHITE : Color.BLACK;
  for(let [iRow, iCol, fRow, fCol] of moves) {
    let movetype = node.board.moveType(iRow, iCol, fRow, fCol);
    let value = node.value;
    if(node.board.pieceAt(fRow, fCol) !== Piece.NULL) {
      let pieceValue = piece_value(node.board.pieceAt(fRow, fCol));
      if(pieceValue > 9) pieceValue = 100;
      value += pieceValue * scale;
    } else if(movetype === MoveType.ENPESANT) {
      value += scale;
    } else if(movetype === MoveType.PROMOTION) {
      value += 8 * scale;
    } else {
      continue;
    }
    let boardcopy = node.board.move(iRow, iCol, fRow, fCol);
    output.push(new CaptureTreeNode(boardcopy, value, oppoColor, [], 
      node.depth + 1));
  }
  return output;
}

function assembleTree(board, color, depth) {
  let root = new CaptureTreeNode(board, 0, color, [], 0);
  let queue = [root];
  while(queue.length > 0) {
    let node = queue.pop();
    if(node.depth >= depth) continue;
    node.children = listDescendents(node);
    for(let child of node.children) queue.push(child);
  }
  return root;
}

function collapseTree(root) {
  let stack = [root];
  while(stack.length > 0) {
    let node = stack[stack.length - 1];
    let scale = node.toMove === Color.BLACK ? -1 : 1;
    //scan for no children children
    for(let i = node.children.length - 1; i >= 0; i--) {
      let child = node.children[i];
      if(child.children.length === 0) {
        node.value = 
          scale * (Math.max(scale * child.value, scale * node.value));
        node.children.splice(i, 1);
      }
    }
    //now scan for alpha-beta prunable children
    for(let i = node.children.length - 1; i >= 0; i--) {
      let child = node.children[i];
      if(scale * (node.value - child.value) > 0) {
        node.children.splice(i, 1);
      }
    }
    //if there are "undecided" children, iterate on them, otherwise, pop
    //current node off the stack
    if(node.children.length > 0) {
      stack.push(node.children[0]);
    } else {
      stack.pop();
    }
  }
}

/*
function computeHangingMaterial(board, color) {
  let root = assembleTree(board, color, 3); //arbitrary depth 3
  collapseTree(root);
  let scale = color === Color.BLACK ? -1 : 1;
  return scale * root.value;
}
*/
function computeHangingMaterial(board, color) {
  return computeCapturable(board, color);
}

function computeCapturableMaterial(board, color) {
  let output = 0;
  let moves = listLegalMoves(board, color);
  let squares = ChessMap.fromDefault(0);
  for(let [iRow, iCol, fRow, fCol] of moves) {
    squares.set(fRow, fCol, 1);
  }
  for(let i = 0; i < 8; i++) {
    for(let j = 0; j < 8; j++) {
      output += squares.get(i, j) * piece_value(board.pieceAt(i, j));
    }
  }
  return output;
}

function computeFeatures(iRow, iCol, fRow, fCol, board) {
  let output = {}
  let moved_piece = board.pieceAt(iRow, iCol, fRow, fCol);
  let start_color = colorOf(moved_piece);
  let target_piece = board.pieceAt(fRow, fCol);
  let oppo_color = colorOf(moved_piece) === Color.WHITE ? Color.BLACK 
    : Color.WHITE;
  output.is_capture = colorOf(target_piece) !== Color.NONE ? piece_value(target_piece) : 0;
  output.forward = colorOf(moved_piece) === Color.WHITE ? 
    Math.max(fRow - iRow, 0) : Math.max(iRow - fRow, 0);
  output.capture_up = Math.max(piece_value(target_piece) - piece_value(moved_piece), 0);
  output.capture_king = piece_value(target_piece) > 9;
  output.center_bonus = centrality(fRow, fCol) - centrality(iRow, iCol);
  output.moved_value = piece_value(moved_piece);
  output.castling = piece_value(moved_piece) > 9 && Math.abs(fCol - iCol) > 1;
  //compute open_lines bonus
  let baseline = listLegalMoves(board, start_color).length;
  let board_copy = board.move(iRow, iCol, fRow, fCol);
  let new_moves = listLegalMoves(board_copy, start_color).length;
  output.open_lines_bonus = new_moves - baseline;
  let oppo_baseline = listLegalMoves(board, oppo_color).length;
  let oppo_new_moves = listLegalMoves(board_copy, oppo_color).length;
  output.restriction_bonus = oppo_baseline - oppo_new_moves;
  //capturable material detriment
  output.hanging = computeHangingMaterial(board_copy, oppo_color)
    - computeHangingMaterial(board, oppo_color);
  output.oppo_hanging = computeHangingMaterial(board_copy, start_color)
    - computeHangingMaterial(board, start_color);
  output.self_capturable = computeCapturableMaterial(board_copy, oppo_color)
    - computeCapturableMaterial(board, oppo_color);
  output.oppo_capturable = computeCapturableMaterial(board_copy, start_color)
    - computeCapturableMaterial(board, start_color);
  return output;
}

export {listLegalMoves, computeFeatures, piece_value}
