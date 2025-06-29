import {Piece, Color, colorOf, flipColor, MoveType} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {ChessMap, ChessBitMap} from "../data/maps.mjs";

function pieceValue(piece) {
  switch(piece) {
    case Piece.NULL: return 0;
    case Piece.W_PAWN:
    case Piece.B_PAWN: return 1;
    case Piece.W_KNIGHT:
    case Piece.B_KNIGHT:
    case Piece.W_BISHOP:
    case Piece.B_BISHOP: return 3;
    case Piece.W_ROOK:
    case Piece.B_ROOK: return 5;
    case Piece.W_QUEEN:
    case Piece.B_QUEEN: return 9;
    case Piece.W_KING:
    case Piece.B_KING: return 100;
    default: throw new Error("Incomplete case match: " + piece);
  }
}

function canMoveAway(board, square, direction) {
  let r = (square >> 4) & 7;
  let c = square & 7;
  let piece = board.pieceAt(r, c);
  let dr = (direction >> 4) & 7;
  let dc = direction & 7;
  if(piece === Piece.W_PAWN) {
    let push = board.pieceAt(r + 1, c) === Piece.NULL;
    let captureLeft = c - 1 >= 0 
     && board.moveType(r, c, r + 1, c - 1) !== MoveType.INVALID;
    let captureRight = c + 1 <= 7
     && board.moveType(r, c, r + 1, c + 1) !== MoveType.INVALID;
    if(dc === 0) return captureLeft || captureRight;
    return captureRight || captureLeft || push;
  }
  if(piece === Piece.B_PAWN) {
    let push = board.pieceAt(r - 1, c) === Piece.NULL;
    let captureLeft = board.moveType(r, c, r - 1, c - 1) !== MoveType.INVALID;
    let captureRight = board.moveType(r, c, r - 1, c + 1) !== MoveType.INVALID;
    if(dc === 0) return captureLeft || captureRight;
    return captureRight || captureLeft || push;
  }
  return true;
}

/**
 * Returns a ChessMap [m] such that if [board] has a piece of color opposite
 * [color] at square [r, c], then [m(r, c)] contains a list of squares
 * containing pieces of color [color] that attack the piece at [r, c]. Squares
 * will be represented in 0x88 notation, with the row taking the more
 * significant bits and the column taking least significant bits.
 */
function listAttackers(board, color) {
  let output = ChessMap.fromInitializer((r, c) => {return []});
  let oppoColor = flipColor(color);
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      if(colorOf(board.pieceAt(r, c)) !== color) continue;
      let currentSquare = (r << 4) | c;
      let currentPiece = board.pieceAt(r, c);
      if(colorOf(board.pieceAt(r, c)) !== color) continue;
      if(board.pieceAt(r, c) === Piece.W_PAWN) {
        if(c > 0 && colorOf(board.pieceAt(r + 1, c - 1)) === oppoColor) {
          output.get(r + 1, c - 1).push(currentSquare);
        }
        if(c < 7 && colorOf(board.pieceAt(r + 1, c + 1)) === oppoColor) {
          output.get(r + 1, c + 1).push(currentSquare);
        }
      }
      if(board.pieceAt(r, c) === Piece.B_PAWN) {
        if(c > 0 && colorOf(board.pieceAt(r - 1, c - 1)) === oppoColor) {
          output.get(r - 1, c - 1).push(currentSquare);
        }
        if(c < 7 && colorOf(board.pieceAt(r - 1, c + 1)) === oppoColor) {
          output.get(r - 1, c + 1).push(currentSquare);
        }
      }
      if(currentPiece === Piece.B_KNIGHT || currentPiece === Piece.W_KNIGHT) {
        let deltas = [0x12, 0x21, -0xe, -0x1f, 0xe, 0x1f, -0x12, -0x21];
        for(let d of deltas) {
          let newSquare = currentSquare + d;
          if(((newSquare & 0x88) === 0) 
            && colorOf(board.pieceAt((newSquare >> 4) & 7, newSquare & 7)) 
            === oppoColor) {
            output.get((newSquare >> 4) & 7, newSquare & 7).push(currentSquare);
          }
        }
      }
      if(currentPiece === Piece.B_KING || currentPiece === Piece.W_KING) {
        let deltas = [0x01, -0x01, 0x11, 0x10, 0xf, -0xf, -0x10, -0x11];
        for(let d of deltas) {
          let newSquare = currentSquare + d;
          if(((newSquare & 0x88) === 0)
            && colorOf(board.pieceAt((newSquare >> 4) & 7, newSquare & 7))
            === oppoColor) {
            output.get((newSquare >> 4) & 7, newSquare & 7).push(currentSquare);
          }
        }
      }
      if(currentPiece === Piece.B_BISHOP || currentPiece === Piece.W_BISHOP
        || currentPiece === Piece.B_QUEEN || currentPiece === Piece.W_QUEEN) {
        let directions = [0x11, 0xf, -0x11, -0xf];
        for(let d of directions) {
          let discover = false;
          for(let newSquare = currentSquare + d; (newSquare & 0x88) === 0; 
           newSquare += d) {
            let rr = newSquare >> 4 & 7;
            let cc = newSquare & 7;
            let newPiece = board.pieceAt(rr, cc);
            if(newPiece === Piece.NULL) continue;
            if(colorOf(newPiece) === oppoColor) {
              output.get(rr, cc).push(r << 4 | c);
              break;
            }
            if(discover || !canMoveAway(board, newSquare, d)) break;
            discover = true;
          }
        }
      }
      if(currentPiece === Piece.B_ROOK || currentPiece === Piece.W_ROOK
        || currentPiece === Piece.B_QUEEN || currentPiece === Piece.W_QUEEN) {
        let directions = [0x01, -0x01, -0x10, 0x10];
        for(let d of directions) {
          let newSquare = currentSquare + d;
          let discover = false;
          for(let newSquare = currentSquare + d; (newSquare & 0x88) === 0; 
           newSquare += d) {
            let rr = newSquare >> 4 & 7;
            let cc = newSquare & 7;
            let newPiece = board.pieceAt(rr, cc);
            if(newPiece === Piece.NULL) continue;
            if(colorOf(newPiece) === oppoColor) {
              output.get(rr, cc).push(r << 4 | c);
              break;
            }
            if(discover || !canMoveAway(board, newSquare, d)) break;
            discover = true;
          }
        }
      }
    }
  }
  return output;
}

function listDefenders(board, r, c) {
  let output = [];
  //pass through defense is fine up to one level
  //first check for pawns:
  let color = colorOf(board.pieceAt(r, c));
  if(color === Color.WHITE) {
    if(c > 0 && board.pieceAt(r - 1, c - 1) === Piece.W_PAWN) {
      output.push(1);
    }
    if(c < 7 && board.pieceAt(r - 1, c + 1) === Piece.W_PAWN) {
      output.push(1);
    }
  }
  if(color === Color.BLACK) {
    if(c > 0 && board.pieceAt(r + 1, c - 1) === Piece.B_PAWN) {
      output.push(1);
    }
    if(c < 7 && board.pieceAt(r + 1, c + 1) === Piece.B_PAWN) {
      output.push(1);
    }
  }
  //then check for knights
  let knightDirections = [0x12, 0x21, -0xe, -0x1f, 0xe, 0x1f, -0x12, -0x21];
  let currentSquare = r << 4 | c;
  for(let d of knightDirections) {
    let newSquare = currentSquare + d;
    if((newSquare & 0x88) !== 0) continue;
    let piece = board.pieceAt((newSquare >> 4) & 7, newSquare & 7);
    if((color === Color.WHITE && piece === Piece.W_KNIGHT) 
      || (color === Color.BLACK && piece === Piece.B_KNIGHT)) {
      output.push(3);
    }
  }
  //then check for king
  let kingDirections = [0x01, -0x01, 0x11, 0x10, 0xf, -0xf, -0x10, -0x11];
  for(let d of kingDirections) {
    let newSquare = currentSquare + d;
    if((newSquare & 0x88) !== 0) continue;
    let piece = board.pieceAt((newSquare >> 4) & 7, newSquare & 7);
    if((color === Color.WHITE && piece === Piece.W_KING)
      || (color === Color.BLACK && piece === Piece.B_KING)) {
      output.push(100);
    }
  }
  //now scan horizontally
  let rookDirections = [0x01, -0x01, 0x10, -0x10];
  for(let d of rookDirections) {
    let discover = false;
    for(let newSquare = currentSquare + d; (newSquare & 0x88) === 0; 
     newSquare += d) {
      let nr = (newSquare >> 4) & 7;
      let nc = newSquare & 7;
      let piece = board.pieceAt(nr, nc);
      if(piece === Piece.NULL) continue;
      if(colorOf(piece) !== color) break;
      if(piece === Piece.B_ROOK || piece === Piece.W_ROOK) {
        output.push(5);
      } else if(piece === Piece.B_QUEEN || piece === Piece.W_QUEEN) {
        output.push(9);
      } else {
        if(!discover && canMoveAway(board, newSquare, d)) {
          discover = true;
        } else break;
      }
    }
  }
  let bishopDirections = [0x11, 0xf, -0xf, -0x11];
  for(let d of bishopDirections) {
    let newSquare = currentSquare + d;
    let discover = false;
    for(let newSquare = currentSquare + d; (newSquare & 0x88) === 0; 
     newSquare += d) {
      let nr = (newSquare >> 4) & 7;
      let nc = newSquare & 7;
      let piece = board.pieceAt(nr, nc);
      if(piece === Piece.NULL) continue;
      if(colorOf(piece) !== color) break;
      if(piece === Piece.B_BISHOP || piece === Piece.W_BISHOP) {
        output.push(3);
      } else if(piece === Piece.B_QUEEN || piece === Piece.W_QUEEN) {
        output.push(9);
      } else if(!discover && canMoveAway(board, newSquare, d)) {
        discover = true;
      } else break;
    }
  }
  return output;
}

/**
 * Returns a ChessMap mapping squares on [board] containing pieces of [color]
 * to a list of squares containing lower-value opponent's pieces that can attack
 * that piece in one move.
 */
function listAttackable(board, color) {
  let oppocolor = flipColor(color);
  let oppomoves = board.listLegalMoves(oppocolor);
  let output = ChessMap.fromInitializer(() => {return []});
  for(let [iRow, iCol, fRow, fCol] of oppomoves) {
    let newBoard = board.move(iRow, iCol, fRow, fCol);
    let newVision = newBoard.listLegalMovesFromSquare(fRow, fCol);
    let movedPieceValue = pieceValue(board.pieceAt(iRow, iCol));
    for(let [ir, ic, fr, fc] of newVision) {
      let targetPiece = newBoard.pieceAt(fr, fc);
      if(colorOf(targetPiece) === color 
       && pieceValue(targetPiece) > movedPieceValue) {
        output.get(fr, fc).push([iRow, iCol]);
      }
    }
  }
  return output;
}

/**
 * Returns (approximately) the net amount of material gain possible for the 
 * player with [color]. Sometimes returns a generous overestimate.
 */
function computeCapturable(board, color) {
  let attacks = listAttackers(board, color);
  let output = 0;
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      if(attacks.get(r, c).length === 0) continue;
      let attackers = attacks.get(r, c).map((square) => {
        return pieceValue(board.pieceAt((square >> 4) & 7, square & 7));
      });
      let defenders = listDefenders(board, r, c);
      attackers.sort((a, b) => a - b);
      defenders.sort((a, b) => a - b);
      let base = pieceValue(board.pieceAt(r, c));
      if(base > 9) {
        output += 100;
      }
      let values = [0, base];
      for(let i = 0; i < Math.min(attackers.length - 1, defenders.length); i++) {
        values.push(values[values.length - 1] - attackers[i]);
        values.push(values[values.length - 1] + defenders[i]);
      }
      if(defenders.length >= attackers.length) {
        values.push(
          values[values.length - 1] - attackers[attackers.length - 1]
        );
      }
      for(let i = values.length - 1; i >= 1; i--) {
        if(i & 1) values[i - 1] = Math.max(values[i], values[i - 1]);
        else values[i - 1] = Math.min(values[i], values[i - 1]);
      }
      output += values[0];
    }
  }
  return output;
}

function computeTacticalValue(iRow, iCol, fRow, fCol, board, newBoard, color) {
  let oppocolor = flipColor(color);
  let movetype = board.moveType(iRow, iCol, fRow, fCol);
  let captured = movetype === MoveType.ENPESANT ? 
    1 : pieceValue(board.pieceAt(fRow, fCol));
  if(movetype === MoveType.PROMOTION) captured += 8;
  return captured 
    - computeCapturable(newBoard, oppocolor);
}

/**
 * Compute increase in number of legal moves
 */
function computeOpenLinesBonus(iRow, iCol, fRow, fCol, board, newBoard, color) {
  let baseline = board.listLegalMoves(color).length;
  let newCount = newBoard.listLegalMoves(color).length;
  return newCount - baseline;
}

/**
 * Compute decrease in number of opponent's legal moves
 */
function computeRestrictionBonus(iRow, iCol, fRow, fCol, board, newBoard, color) {
  let baseline = board.listLegalMoves(flipColor(color)).length;
  let newCount = newBoard.listLegalMoves(flipColor(color)).length;
  return baseline - newCount;
}

function countSafeMoves(board, color) {
  let moves = board.listLegalMoves(color);
  let output = 0;
  for(let [iRow, iCol, fRow, fCol] of moves) {
    if(computeTacticalValue(iRow, iCol, fRow, fCol, board, 
      board.move(iRow, iCol, fRow, fCol), color) >= 0) output += 1
  }
  return output;
}

/**
 * Compute increase in number of moves that don't blunder.
 */
function computeSafeOpenLines(iRow, iCol, fRow, fCol, board, newBoard, color) {
  //console.log(countSafeMoves(newBoard, color));
  //console.log(countSafeMoves(board, color));
  return countSafeMoves(newBoard, color) - countSafeMoves(board, color);
}

/**
 * Compute increase in number of opponent's moves that don't blunder.
 */
function computeSafeRestrictionBonus(iRow, iCol, fRow, fCol, board, newBoard, color) {
  return countSafeMoves(board, flipColor(color)) - countSafeMoves(newBoard,
    flipColor(color));
}

function centralityBonus(iRow, iCol, fRow, fCol) {
  return Math.min(fRow, 7 - fRow, fCol, 7 - fCol)
    - Math.min(iRow, 7 - iRow, iCol, 7 - iCol);
}

function computeFeatures(iRow, iCol, fRow, fCol, board) {
  let movetype = board.moveType(iRow, iCol, fRow, fCol);
  let color = colorOf(board.pieceAt(iRow, iCol));
  let newBoard = board.move(iRow, iCol, fRow, fCol);
  let output = {};
  let capturable = computeCapturable(board, flipColor(color));
  output.captures = movetype === MoveType.ENPESANT ? 1 :
    pieceValue(board.pieceAt(fRow, fCol));
  if(movetype === MoveType.PROMOTION) {
    output.captures += 8;
  }
  output.tacticalValue = computeTacticalValue(iRow, iCol, fRow, fCol, board, 
    newBoard, color) + capturable;
  output.legalMoveBonus = computeOpenLinesBonus(iRow, iCol, fRow, fCol, board,
    newBoard, color);
  output.legalRestrictBonus = computeRestrictionBonus(iRow, iCol, fRow, fCol,
    board, newBoard, color);
  output.safeMovesBonus = computeSafeOpenLines(iRow, iCol, fRow, fCol, board,
    newBoard, color);
  output.safeRestrictBonus = computeSafeRestrictionBonus(iRow, iCol, fRow,
    fCol, board, newBoard, color);
  output.castling = movetype === MoveType.CASTLE;
  output.forward = color === Color.WHITE ? fRow - iRow : iRow - fRow;
  output.centerBonus = centralityBonus(iRow, iCol, fRow, fCol);
  return output;
}

export {computeCapturable, listAttackers, listDefenders, listAttackable, pieceValue, computeFeatures, computeTacticalValue, centralityBonus, countSafeMoves}
