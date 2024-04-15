
import {ChessMap, ChessBitMap, LegalMoveMap} from "./maps.mjs";
import {Piece, Color, colorOf, MoveType} from "./enums.mjs";

/**
 * This section of code defines the starting state of the ChessBoard
 */

let board = [];
board.push(Piece.W_ROOK);
board.push(Piece.W_KNIGHT);
board.push(Piece.W_BISHOP);
board.push(Piece.W_QUEEN);
board.push(Piece.W_KING);
board.push(Piece.W_BISHOP);
board.push(Piece.W_KNIGHT);
board.push(Piece.W_ROOK);
for(let i = 0; i < 8; i++) board.push(Piece.W_PAWN);
for(let i = 0; i < 32; i++) board.push(Piece.NULL);
for(let i = 0; i < 8; i++) board.push(Piece.B_PAWN);
board.push(Piece.B_ROOK);
board.push(Piece.B_KNIGHT);
board.push(Piece.B_BISHOP);
board.push(Piece.B_QUEEN);
board.push(Piece.B_KING);
board.push(Piece.B_BISHOP);
board.push(Piece.B_KNIGHT);
board.push(Piece.B_ROOK);
let legalMoveMap = LegalMoveMap.empty();
for(let i = 0; i < 8; i++) {
  legalMoveMap.set(1, i, 2, i, true);
  legalMoveMap.set(1, i, 3, i, true);
  legalMoveMap.set(6, i, 5, i, true);
  legalMoveMap.set(6, i, 4, i, true);
}
legalMoveMap.set(0, 1, 2, 0, true);
legalMoveMap.set(0, 1, 2, 2, true);
legalMoveMap.set(0, 6, 2, 5, true);
legalMoveMap.set(0, 6, 2, 7, true);
legalMoveMap.set(7, 1, 5, 0, true);
legalMoveMap.set(7, 1, 5, 2, true);
legalMoveMap.set(7, 6, 5, 5, true);
legalMoveMap.set(7, 6, 5, 7, true);

const START = {
  board: ChessMap.fromList(board),
  moves: legalMoveMap,
  wkcastle: true,
  bkcastle: true,
  wqcastle: true,
  bqcastle: true,
  wep: [],
  bep: [],
  bking: true,
  wking: true,
};

/**
 * Helper functions and definitions for manipulating board state.
 */

//pieces that attack diagonal, straight lines
const DIAG = [Piece.W_BISHOP, Piece.B_BISHOP, Piece.W_QUEEN, Piece.B_QUEEN];
const STRAIGHT = [Piece.W_ROOK, Piece.B_ROOK, Piece.W_QUEEN, Piece.B_QUEEN];

//[dr, dc] pairs for knights and kings
const KNIGHT_DELTA = [
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
];

const KING_DELTA = [
  [1, 1],
  [1, 0],
  [1, -1],
  [0, 1],
  [0, -1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

//returns [i] such that board.get(r + i * dr, c + i * dc) is a non-null piece,
//and 1 <= i <= maxRange. If no such [i] can be found, then zero is returned.
//Requires r + i * dr, c + i * dc to be in bounds for all i between 1 and
//maxRange
//[board] is a ChessMap. [r], [c], [dr], [dc], and [maxRange] are integers.
function findNextPiece(board, r, c, dr, dc, maxRange) {
  let rr = r;
  let cc = c;
  for(let i = 1; i <= maxRange; i++) {
    rr += dr;
    cc += dc;
    if(board.get(rr, cc) !== Piece.NULL) {
      return i;
    }
  }
  return 0;
}

//returns whether coordinates [r, c] are in bounds
function checkBounds(r, c) {
  return ((7 & r) === r) && ((7 & c) === c);
}

//updates the moves from r + plusRange * dr, c + plusRange * dc to 
//r + i * dr, c + i * dc for i in [plusRange - 1, ..., -minusRange].
//WARNING: MODIFIES [moves]
function updateDirection(oldBoard, moves, newColor, r, c, dr, dc, plusRange, 
  minusRange, pieces) {
  if(!plusRange) return;
  let rr = r + dr * plusRange;
  let cc = c + dc * plusRange;
  let piece = oldBoard.get(rr, cc);
  if(!pieces.includes(piece)) return;
  let oldColor = colorOf(oldBoard.get(r, c));
  if(oldColor === newColor) return;
  moves.set(rr, cc, r, c, newColor !== colorOf(piece));
  if(oldColor === Color.NONE) {
    //then the new piece is not nothing, so block everything past the new piece
    for(let i = 1; i <= minusRange; i++) {
      moves.set(rr, cc, r - i * dr, c - i * dc, false);
    }
  }
  if(newColor === Color.NONE && minusRange > 0) {
    //then the old piece is not nothing, so enable everything past the new piece
    for(let i = 1; i < minusRange; i++) {
      moves.set(rr, cc, r - i * dr, c - i * dc, true);
    }
    let endR = r - minusRange * dr;
    let endC = c - minusRange * dc;
    moves.set(rr, cc, endR, endC,
      colorOf(oldBoard.get(endR, endC)) !== colorOf(piece));
  }
}

//Edits state.board and state.moves to reflect changing the piece at [r, c] to
//piece [p].
//WARNING: MODIFIES [state.board] and [state.moves]
function modifySquare(state, r, c, p) {
  let board = state.board;
  let moves = state.moves;
  let oldPiece = board.get(r, c);
  if(oldPiece === p) return state;
  let newColor = colorOf(p);
  //update move list for bishop/queen
  let urd = findNextPiece(board, r, c, 1, 1, Math.min(7 ^ r, 7 ^ c));
  let urdRange = urd ? urd : Math.min(7 ^ r, 7 ^ c);
  let uld = findNextPiece(board, r, c, 1, -1, Math.min(7 ^ r, c));
  let uldRange = uld ? uld : Math.min(7 ^ r, c);
  let lrd = findNextPiece(board, r, c, -1, 1, Math.min(r, 7 ^ c));
  let lrdRange = lrd ? lrd : Math.min(r, 7 ^ c);
  let lld = findNextPiece(board, r, c, -1, -1, Math.min(r, c));
  let lldRange = lld ? lld : Math.min(r, c);
  updateDirection(board, moves, newColor, r, c, 1, 1, urd, lldRange, DIAG);
  updateDirection(board, moves, newColor, r, c, -1, -1, lld, urdRange, DIAG);
  updateDirection(board, moves, newColor, r, c, 1, -1, uld, lrdRange, DIAG);
  updateDirection(board, moves, newColor, r, c, -1, 1, lrd, uldRange, DIAG);
  //update move list for pawn capture
  if(urd === 1 && board.get(r + 1, c + 1) === Piece.B_PAWN) {
    moves.set(r + 1, c + 1, r, c, newColor === Color.WHITE);
  }
  if(uld === 1 && board.get(r + 1, c - 1) === Piece.B_PAWN) {
    moves.set(r + 1, c - 1, r, c, newColor === Color.WHITE);
  }
  if(lrd === 1 && board.get(r - 1, c + 1) === Piece.W_PAWN) {
    moves.set(r - 1, c + 1, r, c, newColor === Color.BLACK);
  }
  if(lld === 1 && board.get(r - 1, c - 1) === Piece.W_PAWN) {
    moves.set(r - 1, c - 1, r, c, newColor === Color.BLACK);
  }
  //update move list for rook/queen
  let up = findNextPiece(board, r, c, 1, 0, 7 ^ r);
  let down = findNextPiece(board, r, c, -1, 0, r);
  let right = findNextPiece(board, r, c, 0, 1, 7 ^ c);
  let left = findNextPiece(board, r, c, 0, -1, c);
  let upRange = up ? up : 7 ^ r;
  let downRange = down ? down : r;
  let leftRange = left ? left : c;
  let rightRange = right ? right : 7 ^ c;
  updateDirection(board, moves, newColor, r, c, 1, 0, up, downRange, STRAIGHT);
  updateDirection(board, moves, newColor, r, c, -1, 0, down, upRange, STRAIGHT);
  updateDirection(board, moves, newColor, r, c, 0, 1, right, leftRange, STRAIGHT);
  updateDirection(board, moves, newColor, r, c, 0, -1, left, rightRange, STRAIGHT);
  //update move list for pawn block/unblock
  if(up === 1 && board.get(r + 1, c) === Piece.B_PAWN) {
    moves.set(r + 1, c, r, c, newColor === Color.NONE);
    moves.set(r + 1, c, r - 1, c, 
      r === 5 && newColor === Color.NONE && downRange > 1);
  }
  if(down === 1 && board.get(r - 1, c) === Piece.W_PAWN) {
    moves.set(r - 1, c, r, c, newColor === Color.NONE);
    moves.set(r - 1, c, r + 1, c,
      r === 2 && newColor === Color.NONE && upRange > 1);
  }
  //check for blocking or unblocking pawn thrust
  if(r === 4 && up === 2 && board.get(r + 2, c) === Piece.B_PAWN) {
    moves.set(r + 2, c, r, c, newColor === Color.NONE);
  }
  if(r === 3 && down === 2 && board.get(r - 2, c) === Piece.W_PAWN) {
    moves.set(r - 2, c, r, c, newColor === Color.NONE);
  }
  //check for knight and king moves
  for(let [dr, dc] of KNIGHT_DELTA) {
    let rr = r + dr;
    let cc = c + dc;
    if(checkBounds(rr, cc)) {
      let pp = board.get(rr, cc);
      if(pp === Piece.W_KNIGHT || pp === Piece.B_KNIGHT) {
        moves.set(rr, cc, r, c, colorOf(pp) !== newColor);
      }
    }
  }
  for(let [dr, dc] of KING_DELTA) {
    let rr = r + dr;
    let cc = c + dc;
    if(checkBounds(rr, cc)) {
      let pp = board.get(rr, cc);
      if(pp === Piece.W_KING || pp === Piece.B_KING) {
        moves.set(rr, cc, r, c, colorOf(pp) !== newColor);
      }
    }
  }
  //finally, set the moves starting from r, c
  moves.zero(r, c);
  if(DIAG.includes(p)) {
    if(urdRange > 0) {
      for(let i = 1; i < urdRange; i++) {
        moves.set(r, c, r + i, c + i, true);
      }
      moves.set(r, c, r + urdRange, c + urdRange, 
        colorOf(board.get(r + urdRange, c + urdRange)) !== newColor);
    }
    if(uldRange > 0) {
      for(let i = 1; i < uldRange; i++) {
        moves.set(r, c, r + i, c - i, true);
      }
      moves.set(r, c, r + uldRange, c - uldRange,
        colorOf(board.get(r + uldRange, c - uldRange)) !== newColor);
    }
    if(lrdRange > 0) {
      for(let i = 1; i < lrdRange; i++) {
        moves.set(r, c, r - i, c + i, true);
      }
      moves.set(r, c, r - lrdRange, c + lrdRange,
        colorOf(board.get(r - lrdRange, c + lrdRange)) !== newColor);
    }
    if(lldRange > 0) {
      for(let i = 1; i < lldRange; i++) {
        moves.set(r, c, r - i, c - i, true);
      }
      moves.set(r, c, r - lldRange, c - lldRange,
        colorOf(board.get(r - lldRange, c - lldRange)) !== newColor);
    }
  }
  if(STRAIGHT.includes(p)) {
    if(upRange > 0) {
      for(let i = 1; i < upRange; i++) {
        moves.set(r, c, r + i, c, true);
      }
      moves.set(r, c, r + upRange, c, 
        colorOf(board.get(r + upRange, c)) !== newColor);
    }
    if(downRange > 0) {
      for(let i = 1; i < downRange; i++) {
        moves.set(r, c, r - i, c, true);
      }
      moves.set(r, c, r - downRange, c,
        colorOf(board.get(r - downRange, c)) !== newColor);
    }
    if(leftRange > 0) {
      for(let i = 1; i < leftRange; i++) {
        moves.set(r, c, r, c - i, true);
      }
      moves.set(r, c, r, c - leftRange,
        colorOf(board.get(r, c - leftRange)) !== newColor);
    }
    if(rightRange > 0) {
      for(let i = 1; i < rightRange; i++) {
        moves.set(r, c, r, c + i, true);
      }
      moves.set(r, c, r, c + rightRange,
        colorOf(board.get(r, c + rightRange)) !== newColor);
    }
  }
  if(p === Piece.W_KNIGHT || p === Piece.B_KNIGHT) {
    for(let [dr, dc] of KNIGHT_DELTA) {
      let rr = r + dr;
      let cc = c + dc;
      if(checkBounds(rr, cc)) {
        moves.set(r, c, rr, cc, colorOf(board.get(rr, cc)) !== newColor);
      }
    }
  }
  if(p === Piece.W_KING || p === Piece.B_KING) {
    for(let [dr, dc] of KING_DELTA) {
      let rr = r + dr;
      let cc = c + dc;
      if(checkBounds(rr, cc)) {
        moves.set(r, c, rr, cc, colorOf(board.get(rr, cc)) !== newColor);
      }
    }
  }
  if(p === Piece.W_PAWN) {
    //one step forward
    if(up !== 1) {
      moves.set(r, c, r + 1, c, true);
    }
    //captures
    if(urd === 1 && colorOf(board.get(r + 1, c + 1)) === Color.BLACK) {
      moves.set(r, c, r + 1, c + 1, true);
    }
    if(uld === 1 && colorOf(board.get(r + 1, c - 1)) === Color.BLACK) {
      moves.set(r, c, r + 1, c - 1, true);
    }
    //pawn thrust
    if(r === 1 && upRange > 2) {
      moves.set(r, c, r + 2, c, true);
    }
  }
  if(p === Piece.B_PAWN) {
    //one step forward
    if(down !== 1) {
      moves.set(r, c, r - 1, c, true);
    }
    if(lrd === 1 && colorOf(board.get(r - 1, c + 1)) === Color.WHITE) {
      moves.set(r, c, r - 1, c + 1, true);
    }
    if(lld === 1 && colorOf(board.get(r - 1, c - 1)) === Color.WHITE) {
      moves.set(r, c, r - 1, c - 1, true);
    }
    if(r === 6 && downRange > 2) {
      moves.set(r, c, r - 2, c, true);
    }
  }
  board.set(r, c, p);
}

function isAttacked(state, r, c, color) {
  //check for bishop/queen/king/pawn capture
  let urd = findNextPiece(state.board, r, c, 1, 1, Math.min(7 ^ r, 7 ^ c));
  let uld = findNextPiece(state.board, r, c, 1, -1, Math.min(7 ^ r, c));
  let lrd = findNextPiece(state.board, r, c, -1, 1, Math.min(r, 7 ^ c));
  let lld = findNextPiece(state.board, r, c, -1, -1, Math.min(r, c));
  if(state.moves.get(r + urd, c + urd, r, c) 
    && colorOf(state.board.get(r + urd, c + urd)) === color) return true;
  if(state.moves.get(r + uld, c - uld, r, c)
    && colorOf(state.board.get(r + uld, c - uld)) === color) return true;
  if(state.moves.get(r - lrd, c + lrd, r, c)
    && colorOf(state.board.get(r - lrd, c + lrd)) === color) return true;
  if(state.moves.get(r - lld, c - lld, r, c)
    && colorOf(state.board.get(r - lld, c - lld)) === color) return true;
  //check for rook/queen/king
  let up = findNextPiece(state.board, r, c, 1, 0, 7 ^ r);
  let down = findNextPiece(state.board, r, c, -1, 0, r);
  let left = findNextPiece(state.board, r, c, -1, 0, c);
  let right = findNextPiece(state.board, r, c, 1, 0, 7 ^ c);
  if(state.moves.get(r + up, c, r, c)
    && colorOf(state.board.get(r + up, c)) === color) return true;
  if(state.moves.get(r - down, c, r, c)
    && colorOf(state.board.get(r - down, c)) === color) return true;
  if(state.moves.get(r, c + right, r, c)
    && colorOf(state.board.get(r, c + right)) === color) return true;
  if(state.moves.get(r, c - left, r, c)
    && colorOf(state.board.get(r, c - left)) === color) return true;
  //check for knight
  for(let [dr, dc] of KNIGHT_DELTA) {
    let rr = r + dr;
    let cc = c + dc;
    if(checkBounds(rr, cc) 
      && state.moves.get(rr, cc, r, c)
      && colorOf(state.board.get(rr, cc)) === color) return true;
  }
  return false;
}

function canWKCastle(state) {
  return state.wkcastle && state.board.get(0, 5) === Piece.NULL
    && state.board.get(0, 6) === Piece.NULL 
    && !isAttacked(state, 0, 4, Color.BLACK)
    && !isAttacked(state, 0, 5, Color.BLACK);
}

function canWQCastle(state) {
  return state.wqcastle && state.board.get(0, 3) === Piece.NULL
    && state.board.get(0, 2) === Piece.NULL
    && state.board.get(0, 1) === Piece.NULL
    && !isAttacked(state, 0, 4, Color.BLACK)
    && !isAttacked(state, 0, 3, Color.BLACK);
}

function canBKCastle(state) {
  return state.bkcastle && state.board.get(7, 5) === Piece.NULL
    && state.board.get(7, 6) === Piece.NULL
    && !isAttacked(state, 7, 4, Color.WHITE)
    && !isAttacked(state, 7, 5, Color.WHITE);
}

function canBQCastle(state) {
  return state.bqcastle && state.board.get(7, 3) === Piece.NULL
    && state.board.get(7, 2) === Piece.NULL
    && state.board.get(7, 1) === Piece.NULL
    && !isAttacked(state, 7, 4, Color.WHITE)
    && !isAttacked(state, 7, 3, Color.WHITE);
}

function moveType(state, iRow, iCol, fRow, fCol) {
  if(state.moves.get(iRow, iCol, fRow, fCol)) {
    let p = state.board.get(iRow, iCol);
    if(p === Piece.W_PAWN) {
      if(fRow === 7) return MoveType.PROMOTION;
      if(iRow === 1 && fRow === 3) return MoveType.PAWN_THRUST;
      return MoveType.MOVE;
    }
    if(p === Piece.B_PAWN) {
      if(fRow === 0) return MoveType.PROMOTION;
      if(iRow === 6 && fRow === 4) return MoveType.PAWN_THRUST;
      return MoveType.MOVE;
    }
    return MoveType.MOVE;
  }
  //check ep first
  if(iRow === 4 && Math.abs(iCol - fCol) === 1 && fRow === 5
    && state.wep.includes(fCol)
    && state.board.get(4, iCol) === Piece.W_PAWN
    && state.board.get(4, fCol) === Piece.B_PAWN) {
    return MoveType.ENPESANT;
  }
  if(iRow === 3 && Math.abs(iCol - fCol) === 1 && fRow === 2
    && state.bep.includes(fCol) && state.board.get(3, iCol) === Piece.B_PAWN
    && state.board.get(3, fCol) === Piece.W_PAWN) {
    return MoveType.ENPESANT;
  }
  if(iRow !== fRow || iCol !== 4) return MoveType.INVALID;
  if(iRow === 0 && fCol >= 6 && canWKCastle(state)) return MoveType.CASTLE;
  if(iRow === 0 && fCol <= 2 && canWQCastle(state)) return MoveType.CASTLE;
  if(iRow === 7 && fCol >= 6 && canBKCastle(state)) return MoveType.CASTLE;
  if(iRow === 7 && fCol <= 2 && canBQCastle(state)) return MoveType.CASTLE;
  return MoveType.INVALID;
}

function listLegalMoves(state) {
  if(!state.wking || !state.bking) return [];
  let output = state.moves.toList();
  for(let c of state.wep) {
    if(state.board.get(4, c) !== Piece.B_PAWN) continue;
    if(state.board.get(5, c) !== Piece.NULL) continue;
    if(c > 0 && state.board.get(4, c - 1) === Piece.W_PAWN) {
      output.push([4, c - 1, 5, c]);
    }
    if(c < 7 && state.board.get(4, c + 1) === Piece.W_PAWN) {
      output.push([4, c + 1, 5, c])
    }
  }
  for(let c of state.bep) {
    if(state.board.get(3, c) !== Piece.W_PAWN) continue;
    if(state.board.get(2, c) !== Piece.NULL) continue;
    if(c > 0 && state.board.get(3, c - 1) === Piece.B_PAWN) {
      output.push([3, c - 1, 2, c]);
    }
    if(c < 7 && state.board.get(3, c + 1) === Piece.B_PAWN) {
      output.push([3, c + 1, 2, c]);
    }
  }
  if(canWKCastle(state)) output.push([0, 4, 0, 6]);
  if(canWQCastle(state)) output.push([0, 4, 0, 2]);
  if(canBKCastle(state)) output.push([7, 4, 7, 6]);
  if(canBQCastle(state)) output.push([7, 4, 7, 2]);
  return output;
}

//returns the new state object after making the move. Does not modify the 
//original
function move(state, iRow, iCol, fRow, fCol) {
  let type = moveType(state, iRow, iCol, fRow, fCol);
  if(type === MoveType.INVALID) return state;
  let output = {
    board: state.board.copy(),
    moves: state.moves.copy(),
    wkcastle: state.wkcastle,
    bkcastle: state.bkcastle,
    wqcastle: state.wqcastle,
    bqcastle: state.bqcastle,
    wep: [...state.wep],
    bep: [...state.bep],
    wking: true,
    bking: true,
  }
  if(iRow === 0 && iCol === 4) {
    output.wkcastle = false;
    output.wqcastle = false;
  }
  if(iRow === 7 && iCol === 4) {
    output.bkcastle = false;
    output.bqcastle = false;
  }
  if((iRow === 0 && iCol === 0) || (fRow === 0 && fCol === 0)) {
    output.wqcastle = false;
  }
  if((iRow === 0 && iCol === 7) || (fRow === 0 && fCol === 7)) {
    output.wkcastle = false;
  }
  if((iRow === 7 && iCol === 0) || (fRow === 7 && fCol === 0)) {
    output.bqcastle = false;
  }
  if((iRow === 7 && iCol === 7) || (fRow === 7 && fCol === 7)) {
    output.bkcastle = false;
  }
  if(type !== MoveType.ENPESANT) {
    if(colorOf(output.board.get(iRow, iCol)) === Color.WHITE) {
      output.wep = [];
    } else {
      output.bep = [];
    }
  }
  if(state.board.get(fRow, fCol) === Piece.B_KING) output.bking = false;
  if(state.board.get(fRow, fCol) === Piece.W_KING) output.wking = false;
  if(type === MoveType.PROMOTION) {
    modifySquare(output, iRow, iCol, Piece.NULL);
    if(fRow === 7) {
      modifySquare(output, fRow, fCol, Piece.W_QUEEN);
    } else {
      modifySquare(output, fRow, fCol, Piece.B_QUEEN);
    }
  } else if(type === MoveType.ENPESANT) {
    modifySquare(output, fRow, fCol, output.board.get(iRow, iCol));
    modifySquare(output, iRow, iCol, Piece.NULL);
    modifySquare(output, iRow, fCol, Piece.NULL);
  } else if(type === MoveType.CASTLE) {
    if(fCol > iCol) {
      modifySquare(output, iRow, iCol + 2, output.board.get(iRow, iCol));
      modifySquare(output, iRow, iCol + 1, output.board.get(iRow, 7));
      modifySquare(output, iRow, iCol, Piece.NULL);
      modifySquare(output, iRow, 7, Piece.NULL);
    } else {
      modifySquare(output, iRow, iCol - 2, output.board.get(iRow, iCol));
      modifySquare(output, iRow, iCol - 1, output.board.get(iRow, 0));
      modifySquare(output, iRow, iCol, Piece.NULL);
      modifySquare(output, iRow, 0, Piece.NULL);
    }
  } else if(type === MoveType.PAWN_THRUST) {
    modifySquare(output, fRow, fCol, output.board.get(iRow, iCol));
    modifySquare(output, iRow, iCol, Piece.NULL);
    if(iRow === 1) {
      output.bep.push(iCol);
    } else {
      output.wep.push(iCol);
    }
  } else if(type === MoveType.MOVE) {
    modifySquare(output, fRow, fCol, output.board.get(iRow, iCol));
    modifySquare(output, iRow, iCol, Piece.NULL);
  } else {
    throw new Error("Incomplete case match");
  }
  return output;
}

/**
 * The remaining code contains the module exports
 */

/**
 * ChessBoard class represents the ChessBoard state. ChessBoard objects are
 * immutable by design; their memebers must not be modified to ensure
 * correctness. In addition, the constructor should not be used by client
 * classes; instead, novel board states should be generated by making moves
 * from ChessBoard.startingPosition();
 */
class ChessBoard {
  static START_POS = new ChessBoard(START);
  constructor(state) {
    this.state = state;
    //this.listLegalMoves() uses these Cache members
    this.moveCache = undefined;
    this.whiteMoveCache = undefined;
    this.blackMoveCache = undefined;
    this.whiteAttackComputedCache = ChessBitMap.empty();
    this.blackAttackComputedCache = ChessBitMap.empty();
    this.blackAttackCache = ChessBitMap.empty();
    this.whiteAttackCache = ChessBitMap.empty();
  }
  /**
   * Returns the starting position.
   */
  static startingPosition() {
    return ChessBoard.START_POS;
  }
  toString() {
    throw new Error("Unimplemented");
  }
  static fromString() {
    throw new Error("Unimplemented");
  }
  /**
   * Returns the piece at row [r], column [c].
   */
  pieceAt(r, c) {
    return this.state.board.get(r, c);
  }
  /**
   * Returns the MoveType of the move starting at [iRow, iCol], ending at
   * [fRow, fCol].
   */
  moveType(iRow, iCol, fRow, fCol) {
    if(!this.state.bking || !this.state.wking) return MoveType.INVALID;
    return moveType(this.state, iRow, iCol, fRow, fCol);
  }
  /**
   * Returns a new ChessBoard object such that the returned object represents
   * the board state after making the specified move on [this] board. The move
   * starts at [iRow, iCol] and ends at [fRow, fCol]. If the move is invalid,
   * a copy of the current board is returned.
   */
  move(iRow, iCol, fRow, fCol) {
    if(this.moveType(iRow, iCol, fRow, fCol) === MoveType.INVALID) return this;
    return new ChessBoard(move(this.state, iRow, iCol, fRow, fCol));
  }
  /**
   * Returns a list of legal moves on [this] ChessBoard for the player of color
   * [color], or a list containing the legal moves for both players if [color]
   * is undefined. Each move is represented by a list of four ints 
   * [iRow, iCol, fRow, fCol] such that the move starts at [iRow, iCol] and
   * ends at [fRow, fCol].
   * 
   * WARNING: the output of this function MUST NOT be modified, since it's a
   * pointer to sensitive internal data (for speed purposes)
   */
  listLegalMoves(color) {
    if(color === undefined) {
      if(this.moveCache !== undefined) return this.moveCache;
      let output = listLegalMoves(this.state);
      this.moveCache = output;
      return output;
    }
    if(color === Color.WHITE) {
      if(this.whiteMoveCache !== undefined) return this.whiteMoveCache;
      let allMoves = this.listLegalMoves();
      let whiteMoves = [];
      for(let [iRow, iCol, fRow, fCol] of allMoves) {
        if(colorOf(this.state.board.get(iRow, iCol)) === Color.WHITE) {
          whiteMoves.push([iRow, iCol, fRow, fCol]);
        }
      }
      this.whiteMoveCache = whiteMoves;
      return this.whiteMoveCache;
    }
    if(color === Color.BLACK) {
      if(this.blackMoveCache !== undefined) return this.blackMoveCache;
      let allMoves = this.listLegalMoves();
      let blackMoves = [];
      for(let [iRow, iCol, fRow, fCol] of allMoves) {
        if(colorOf(this.state.board.get(iRow, iCol)) === Color.BLACK) {
          blackMoves.push([iRow, iCol, fRow, fCol]);
        }
      }
      this.blackMoveCache = blackMoves;
      return this.blackMoveCache;
    }
    throw new Error("Why is color not WHITE, BLACK, or undefined?");
  }
  listLegalMovesFromSquare(r, c) {
    let output = this.state.moves.getAll(r, c).map((dest) => {
      return [r, c, dest[0], dest[1]];
    });
    if(r === 3 && this.pieceAt(r, c) === Piece.B_PAWN) {
      if(this.state.bep.includes(c + 1) 
       && this.pieceAt(r, c + 1) === Piece.W_PAWN
       && this.pieceAt(r - 1, c + 1) === Piece.NULL) {
        output.push([r, c, r - 1, c + 1]);
      }
      if(this.state.bep.includes(c - 1)
       && this.pieceAt(r, c - 1) === Piece.B_PAWN
       && this.pieceAt(r - 1, c - 1) === Piece.NULL) {
        output.push([r, c, r - 1, c - 1]);
      }
    }
    if(r === 4 && this.pieceAt(r, c) === Piece.W_PAWN) {
      if(this.state.wep.includes(c + 1)
       && this.pieceAt(r, c + 1) === Piece.W_PAWN
       && this.pieceAt(r + 1, c + 1) === Piece.NULL) {
        output.push([r, c, r + 1, c + 1]);
      }
      if(this.state.bep.includes(c - 1)
       && this.pieceAt(r, c + 1) === Piece.B_PAWN
       && this.pieceAt(r + 1, c - 1) === Piece.NULL) {
        output.push([r, c, r + 1, c - 1]);
      }
    }
    if(r === 0 && c === 4 && canWKCastle(this.state)) output.push([0, 4, 0, 6]);
    if(r === 0 && c === 4 && canWQCastle(this.state)) output.push([0, 4, 0, 2]);
    if(r === 7 && c === 4 && canBKCastle(this.state)) output.push([7, 4, 7, 6]);
    if(r === 7 && c === 4 && canBQCastle(this.state)) output.push([7, 4, 7, 2]);
    return output;
  }
  /**
   * Returns whether the player playing [color] is attacking the square [r, c]
   */
  isAttacked(r, c, color) {
    if(color === Color.WHITE) {
      if(this.whiteAttackComputedCache.get(r, c)) {
        return this.whiteAttackCache.get(r, c);
      }
      let output = isAttacked(this.state, r, c, color);
      this.whiteAttackComputedCache.set(r, c, true);
      this.whiteAttackCache.set(r, c, output);
      return output;
    }
    if(color === Color.BLACK) {
      if(this.blackAttackComputedCache.get(r, c)) {
        return this.blackAttackCache.get(r, c);
      }
      let output = isAttacked(this.state, r, c, color);
      this.blackAttackComputedCache.set(r, c, true);
      this.blackAttackCache.set(r, c, output);
      return output;
    }
    throw new Error("What color you playin'?");
  }
}

export {ChessBoard};
