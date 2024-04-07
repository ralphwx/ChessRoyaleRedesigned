
import {GameData, Move} from "../data/gamedata.mjs";
import {Color, Piece, MoveType, ELIXIR, DELAY, LoginType, Location} from "../data/enums.mjs";
import {connect} from "../frontend/metaauthclient.mjs";
import {GameModel} from "../frontend/game_model.mjs";
import {Mutex} from "async-mutex";
import {printBoard} from "../tests/test_framework.mjs";


function moveEq(m1, m2) {
  let {iRow, iCol, fRow, fCol} = m1;
  return m2.iRow === iRow && m2.iCol === iCol 
    && m2.fRow === fRow && m2.fCol === fCol
}

/**
 * Returns true if [movePair] is already in [list]. 
 * [movePair] is a list of two Move objects and [list] is a list of
 * objects containing lists of two Move objects.
 */
function duplicateCheck(movePair, list) {
  let [m1, m2] = movePair;
  for(let [mm1, mm2] of list) {
    if((moveEq(m1, mm2) && moveEq(m2, mm1))
      || (moveEq(m1, mm1) && moveEq(m2, mm2))) {
      return true;
    }
  }
  return false;
}

/**
 * Returns whether the square iRow, iCol is attacked by a player playing 
 * [color].
 */
function isAttacked(board, r, c, color) {
  return board.isAttacked(r, c, color);
}

/**
 * Returns whether a move pair [move, newmove] is tactically relevant.
 * Currently, tactically relevant move pairs fall into one of five
 * categories
 *   - double capture
 *   - discovered capture
 *   - discovered block
 *   - escape square
 *   - double retreat
 */
function isTacticallyRelevant(board, move, newmove) {
  let color = move.color;
  let oppoColor = flipColor(color);
  let oppoMoves = board.listLegalMoves(oppoColor);
  //first check double capture
  let {iRow: ir1, iCol: ic1, fRow: fr1, fCol: fc1} = move;
  let {iRow: ir2, iCol: ic2, fRow: fr2, fCol: fc2} = newmove;
  let firstMoveCapture = board.pieceAt(fr1, fc1) !== Piece.NULL ||
    board.moveType(ir1, ic1, fr1, fc1) === MoveType.ENPESANT;
  let secondMoveCapture = board.pieceAt(fr2, fc2) !== Piece.NULL ||
    board.moveType(ir2, ic2, fr2, fc2) === MoveType.ENPESANT;
  if(firstMoveCapture && secondMoveCapture) return true;
  //next check for double retreat/discovered retreat
  //let newboardstate = board.move(ir1, ic1, fr1, fc1);
  //let secondMoveRetreat = isAttacked(newboardstate, ir2, ic2, oppoColor);
  //let firstMoveBoard = board.move(ir2, ic2, fr2, fc2);
  //let firstMoveRetreat = isAttacked(firstMoveBoard, ir1, ic1, oppoColor);
  //if(firstMoveRetreat && secondMoveRetreat) return true;
  //next, check for discovered capture
  let dr1 = fr2 - ir1;
  let dr2 = ir1 - ir2;
  let dc1 = fc2 - ic1;
  let dc2 = ic1 - ic2;
  if(secondMoveCapture && dr1 * dc2 === dr2 * dc1) {
    return true;
  }
  //next check for discovered block
  //one of them is a capture and the ending squares are on a line
  //don't bother checking for an attacking piece on the other side, that
  //takes too long
  let dr = fr2 - fr1;
  let dc = fc2 - fc1;
  if((firstMoveCapture || secondMoveCapture) 
   && (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0)) {
    return true;
  }
  //lastly, check for escape square.
  if(fr2 === ir1 && fc2 === ic1) return true;
  return false;
}

/**
 * Returns a list of [captures, ...moves] objects representing possible
 * continuations from [gamedata] for the player playing [color] at time [now].
 * [captures] is the amount of material captured by the move sequence. [moves]
 * is the list of moves that can be played, up to a length of [number].
 *
 * Currently supports only number <= 2 because duplicate checking is kinda
 * annoying for n >= 3
 *
 * Guarantees that the output is sorted in ascending order by number of moves.
 * Eg, if number is 2, then the null move [] is first, then all single moves,
 * then all double moves.
 */
function listMoves(gamestate, now, color, number) {
  if(number === 0) {
    return [];
  }
  if(number > 2) {
    throw new Error("Unimplemented");
  }

  let output = [];
  let board = gamestate.boardHistory.head;
  for(let [iRow, iCol, fRow, fCol] of board.listLegalMoves(color)) {
    let move = new Move(color, now, iRow, iCol, fRow, fCol);
    if(gamestate.isLegalMove(move)) {
      output.push([move]);
    }
  }
  if(number === 1) return [[]].concat(output);
  if(number !== 2) {
    throw new Error("Expected number to be int, but got: " + number);
  }
  let output_2 = [];
  for(let [move] of output) {
    let newgamestate = gamestate.move(move);
    let newboard = newgamestate.boardHistory.head;
    for(let [iRow, iCol, fRow, fCol] of newboard.listLegalMoves(color)) {
      let newmove = new Move(color, now, iRow, iCol, fRow, fCol);
      let candidate = [move, newmove]
      if(!duplicateCheck(candidate, output_2) 
       && newgamestate.isLegalMove(newmove)
       && isTacticallyRelevant(board, move, newmove)) {
        output_2.push(candidate);
      }
    }
  }
  return [[]].concat(output, output_2);
}

/**
 * Returns the value of [piece]. King is 100 points.
 */
function pieceValue(piece) {
  switch(piece) {
    case Piece.NULL: return 0;
    case Piece.W_PAWN:
    case Piece.B_PAWN: return 1;
    case Piece.W_KNIGHT:
    case Piece.W_BISHOP:
    case Piece.B_KNIGHT:
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

/**
 * Returns the amount of material captured by move [move]. King is treated as
 * 100 points. Assumes all moves in [moves] are legal.
 */
function captureValue(gamestate, moves) {
  let output = 0;
  let board = gamestate.boardHistory.head;
  for(let move of moves) {
    if(board.moveType(move) === MoveType.EN_PESANT) {
      output += 1;
      continue;
    }
    if(board.moveType(move) === MoveType.PROMOTION) output += 8;
    output += pieceValue(board.pieceAt(move.fRow, move.fCol));
    let {iRow, iCol, fRow, fCol} = move;
    board = board.move(iRow, iCol, fRow, fCol);
  }
  return output;
}

function flipColor(color) {
  switch(color) {
    case Color.WHITE: return Color.BLACK;
    case Color.BLACK: return Color.WHITE;
    default: throw new Error("Incomplete case match: " + color);
  }
}

/**
 * Searches down the game tree starting from [gamestate], with players
 * alternating "turns." Player of color [color] takes turn 0, then the
 * other player takes turn 1, and so on, up to the length of [widths]. On the
 * [i]th turn, that player can make up to [widths[i]] moves, with the 
 * requirement that at least one move has to be a capture.
 */
function computeCapturableMaterial(gamestate, now, color, widths, depth) {
  if(widths.length === depth) return 0;
  let candidates = listMoves(gamestate, now, color, widths[depth]);
  let captureValues = candidates.map((m) => captureValue(gamestate, m));
  let order = [];
  for(let i = 0; i < candidates.length; i++) {
    if(captureValues[i] > 0) order.push(i);
    order.push(i);
  }
  order.sort((i, j) => captureValues[j] - captureValues[i]);
  let output = 0;
  let newcolor = flipColor(color);
  for(let index of order) {
    let moves = candidates[index];
    let captures = captureValues[index];
    if(captures <= output) {
      continue;
    }
    let newgamestate = gamestate;
    for(let move of moves) newgamestate = newgamestate.move(move);
    let value = captures - computeCapturableMaterial(newgamestate, now, newcolor, widths, depth + 1);
    if(value > output) {
      output = value;
    }
  }
  return output;
}

function debugPrint(relativeProbs) {
  let base = relativeProbs.reduce((a, x) => a + x, 0);
  console.log(relativeProbs.map(x => x / base));
}

function sample(values, temperature) {
  let max = Math.max(...values);
  let relativeProbs = values.map(x => 
    x < 0 ? 0 : Math.exp((x - max) / temperature)
  );
  let base = relativeProbs.reduce((a, x) => a + x, 0);
  if(base < 1e-6) {
    return Math.floor(Math.random() * values.length);
  }
  let sample = Math.random();
  for(let i = 0; i < relativeProbs.length; i++) {
    sample -= relativeProbs[i] / base;
    if(sample < 0) return i;
  }
  return relativeProbs.length - 1;
}

function selectTactic(gamestate, now, tactic_candidates, tactic_values, 
  temperature) {
  //select a single move if possible, otherwise select a double move
  let singles = [];
  let single_values = [];
  for(let i = 0; i < tactic_candidates.length; i++) {
    let candidate = tactic_candidates[i];
    if(candidate.length === 1) {
      singles.push(candidate);
      single_values.push(tactic_values[i]);
    }
  }
  if(singles.length > 0) {
    let i = sample(single_values, temperature);
    return [singles[i][0], single_values[i]];
  }
  //otherwise all tactics are two-move tactics.
  let i = sample(tactic_values, temperature);
  return [tactic_candidates[i][0], tactic_values[i]];
}

function checkCaptureUp(board, move, color) {
  let [iRow, iCol, fRow, fCol] = move;
  let newboard = board.move(iRow, iCol, fRow, fCol);
  //count moves that end on that square, plus en passant if relevant
  let newMoves = newboard.listLegalMoves(flipColor(color));
  for(let [ir, ic, fr, fc] of newMoves) {
    if(fr === fRow && fc === fCol 
     && pieceValue(board.pieceAt(iRow, iCol)) 
     >= pieceValue(newboard.pieceAt(ir, ic))) {
      return true;
    }
  }
  if(board.moveType(iRow, iCol, fRow, fCol) === MoveType.ENPESANT) {
    let oppoPawn = color === Color.WHITE ? Piece.B_PAWN : Piece.W_PAWN;
    return (fCol < 7 && board.pieceAt(fRow, fCol + 1) === Piece.B_PAWN)
     || (fCol > 0 && board.pieceAt(fRow, fCol - 1) === Piece.B_PAWN);
  }
  return false;
}

/**
 * Returns the mobility of [color] on board [board], minus the mobility of 
 * the opponent. Mobility is counted as the number of legal moves plus three
 * times the number of legal moves that don't allow a capture up or capture 
 * equal for the opponent.
 */
function mobilityBonus(board, color) {
  let moves = board.listLegalMoves(color);
  let safeMoves = moves.reduce((a, m) => 
   a + !checkCaptureUp(board, m, color), 0);
  let oppoColor = flipColor(color);
  let oppoMoves = board.listLegalMoves(oppoColor);
  let oppoSafeMoves = oppoMoves.reduce((a, m) => 
   a + !checkCaptureUp(board, m, oppoColor), 0);
//  console.log(moves.length);
//  console.log(safeMoves);
//  console.log(oppoMoves.length);
//  console.log(oppoSafeMoves);
  return moves.length + 3 * safeMoves - oppoMoves.length - 3 * oppoSafeMoves;
}

/**
 * Returns [move, value] where [move] is the selected move and [value] is the
 * value of that move. [move] takes the form of {iRow, iCol, fRow, fCol}
 */
function selectMove(gamestate, now, color, temperature) {
  console.log("Received board: ");
  printBoard(gamestate.boardHistory.head);
  let selectStart = Date.now();
  let candidates = listMoves(gamestate, now, color, 2);
  let oppoColor = flipColor(color);
  let tactical_value = [];
  let tactic_candidates = [];
  let tactic_values = [];
  let tacticCheckStart = Date.now();
  let deepCapturableCount = 0;
  for(let moves of candidates) {
    let newgamestate = gamestate;
    for(let move of moves) newgamestate = newgamestate.move(move);
    let value = captureValue(gamestate, moves);
    if(value === 0 && moves.length > 1) {
      value -= computeCapturableMaterial(newgamestate, now + DELAY, oppoColor, [1], 0);
    } else {
      deepCapturableCount++;
      value -= computeCapturableMaterial(newgamestate, now + DELAY, oppoColor, 
       [2, 1, 1], 0);
    }
    tactical_value.push(value);
    if(value > tactical_value[0]) {
      tactic_candidates.push(moves);
      tactic_values.push(value - tactical_value[0]);
    }
  }
  console.log("baseline tactic value: " + tactical_value[0]);
  if(tactic_candidates.length > 0) {
    console.log("Select tactic");
    console.log(tactic_values);
    return selectTactic(gamestate, now, tactic_candidates, tactic_values, 
      temperature);
  }
  let tacticCheckEnd = Date.now();
  console.log("tactic check took: " + (tacticCheckEnd - tacticCheckStart) + "ms");
  //otherwise select based on open lines and restriction bonus
  //open lines baseline = # of single moves that don't lose material
  //open lines after the move = # of double moves containing that move
  // that don't lose material
  let singles = [];
  let values = [];
  for(let i = 1; i < candidates.length; i++) {
    if(candidates[i].length === 2) break;
    singles.push(candidates[i][0]);
    values.push(tactical_value[i]);
  }
  let board = gamestate.boardHistory.head;
  let mobilityBaseline = mobilityBonus(board, color);
  for(let i = 0; i < singles.length; i++) {
    let move = singles[i];
    let {iRow, iCol, fRow, fCol} = move;
    values[i] += (mobilityBonus(board.move(iRow, iCol, fRow, fCol), color) 
      - mobilityBaseline) / 35;
  }
  let i = sample(values, temperature);
  let selectEnd = Date.now();
  console.log("Select took: " + (selectEnd - selectStart));
  console.log("Depp capture count: " + deepCapturableCount);
  return [singles[i], values[i]];
}

export {selectMove};
