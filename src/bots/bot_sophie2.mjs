import {URL, LoginType, Color, flipColor, colorOf, MoveType, ELIXIR, DELAY} 
  from "../data/enums.mjs";
import {ChessMap} from "../data/maps.mjs";
import {Move} from "../data/gamedata.mjs";
import {computeCapturable, listAttackers, listAttackable, listDefenders, 
  pieceValue, computeTacticalValue, centralityBonus, countSafeMoves}
  from "./chess_extension_sophie.mjs";
import {runBot} from "./bot_frame2.mjs";
import {connect} from "../frontend/metaauthclient.mjs";

let DEBUG = import.meta.url !== "file://" + process.argv[1];

function getElixirCount(gamestate, color, now) {
  let eStart = color === Color.WHITE ? gamestate.wStart : gamestate.bStart;
  return (now - eStart) / ELIXIR;
}

function elixirValue(gamestate, color, now) {
  let board = gamestate.boardHistory.head;
  let attackersMap = listAttackers(board, flipColor(color));
  let prospectiveAttackers = listAttackable(board, color);
  let maxAttackMap = ChessMap.fromDefault(0); //map from attackers' squares to
                                     //highest piece value attacked
  let minAttackedMap = ChessMap.fromDefault(100); //map from defender's pieces
                                     //to lowest piece value attacking
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      let attackers = attackersMap.get(r, c);
      let valueAttacked = pieceValue(board.pieceAt(r, c));
      for(let attackerSquare of attackers) {
        let rr = attackerSquare >> 4 & 7;
        let cc = attackerSquare & 7;
        let valueAttacker = pieceValue(board.pieceAt(rr, cc));
        maxAttackMap.set(rr, cc,
         Math.max(maxAttackMap.get(rr, cc), valueAttacked));
        minAttackedMap.set(r, c, Math.min(minAttackedMap.get(r, c),
          valueAttacker));
      }
    }
  }
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      let valueAttacked = pieceValue(board.pieceAt(r, c));
      for(let [rr, cc] of prospectiveAttackers.get(r, c)) {
        let valueAttacker = pieceValue(board.pieceAt(rr, cc));
        maxAttackMap.set(rr, cc,
         Math.max(maxAttackMap.get(rr, cc), valueAttacked));
        minAttackedMap.set(r, c, Math.min(minAttackedMap.get(r, c),
          valueAttacker));
      }
    }
  }
  let evs_attack = [];
  let evs_defense = [];
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      let valueAttacked = maxAttackMap.get(r, c);
      if(valueAttacked === 0) continue;
      let captureUp = valueAttacked - pieceValue(board.pieceAt(r, c));
      if(captureUp > 0) evs_attack.push(captureUp);
    }
  }
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      let valueAttacked = pieceValue(board.pieceAt(r, c));
      let valueAttacker = minAttackedMap.get(r, c);
      let captureUp = valueAttacked - valueAttacker;
      if(captureUp > 0) evs_defense.push(captureUp);
    }
  }
  
  evs_attack.sort((a, b) => {return b - a});
  evs_defense.sort((a, b) => {return b - a});
  let elixirAmount = getElixirCount(gamestate, color, now);
  let index = Math.round(elixirAmount) - 1;
  let mult = (index < 0) + 1;
  if(index < 0) index = 0;
  if(index >= evs_attack.length || index >= evs_defense.length) {
    return 2 / elixirAmount * mult;
  }
  return Math.min(evs_attack[index], evs_defense[index]) * mult;
}

function listLegalMoves(gamestate, color, now) {
  let board = gamestate.boardHistory.head;
  let output = [];
  for(let [iRow, iCol, fRow, fCol] of board.listLegalMoves(color)) {
    let move = new Move(color, now, iRow, iCol, fRow, fCol);
    if(gamestate.isLegalMove(move)) output.push(move);
  }
  return output;
}

function computeThreatValue(board, newBoard, move, color) {
  let {iRow, iCol, fRow, fCol} = move;
  let movetype = board.moveType(iRow, iCol, fRow, fCol);
  let captured = movetype === MoveType.ENPESANT ? 1 
    : pieceValue(board.pieceAt(fRow, fCol));
  let newVision = newBoard.listLegalMovesFromSquare(fRow, fCol);
  let movedPieceValue = pieceValue(board.pieceAt(iRow, iCol));
  let output = captured;
  for(let [ir, ic, fr, fc] of newVision) {
    let targetPiece = newBoard.pieceAt(fr, fc);
    if(colorOf(targetPiece) === flipColor(color)) {
      let captureUp = pieceValue(targetPiece) - movedPieceValue;
      if(captureUp > 0) output += captureUp;
    }
  }
  return output;
}

/**
 * Samples an index [i] from the Maxwell-Boltzmann distribution, with 
 * energies = [-values] and temperature [temperature].
 */
function sample(values, temperature) {
  let probs = [];
  let max = Math.max(...values);
  for(let v of values) probs.push(Math.exp((v - max) / temperature));
  let denom = probs.reduce((a, c) => a + c, 0);
  let s = Math.random();
  probs = probs.map((p) => p / denom);
  for(let i = 0; i < probs.length; i++) {
    s -= probs[i];
    if(s < 0) return i;
  }
  return values.length - 1;
}

function isTacticallyRelevant(gamestate, m1, m2) {
  //a move is tactically relevant if
  // - double capture
  // - discovered capture
  // - discovered block
  // - escape square
  // - unpin?? No but that falls under freeing up safe moves
  let {iRow: ir1, iCol: ic1, fRow: fr1, fCol: fc1} = m1;
  let {iRow: ir2, iCol: ic2, fRow: fr2, fCol: fc2} = m2;
  let capture1 = computeCaptured(gamestate, m1);
  let capture2 = computeCaptured(gamestate.move(m1), m2);

  //check double capture
  if(capture1 > 0 && capture2 > 0) return true;
  //check discovered capture
  if(capture2 && (fc2 - ic2) * (ir1 - ir2) === (fr2 - ir2) * (ic1 - ic2)) {
    return true;
  }
  //check discovered block (which also encompasses most cases of discovered 
  //defense)
  let dr = fr2 - fr1;
  let dc = fc2 - fc1;
  if(capture2 && (dr === dc || dr === -dc || dr === 0 || dc === 0)) return true;
  //check escape square
  return fr2 === ir1 && fc2 === ic1;
}

function listMovePairs(gamedata, color, now) {
  let output = [];
  let gamestate = gamedata.history.head;
  for(let move of listLegalMoves(gamestate, color, now)) {
    for(let move2 of listLegalMoves(gamestate.move(move), color, now)) {
      if(isTacticallyRelevant(gamestate, move, move2)) {
        output.push([move, move2]);
      }
    }
  }
  return output;
}

function computeCaptured(gamestate, move) {
  let {iRow, iCol, fRow, fCol} = move;
  let board = gamestate.boardHistory.head;
  let movetype = board.moveType(iRow, iCol, fRow, fCol);
  if(movetype === MoveType.ENPESANT) return 1;
  let output = pieceValue(board.pieceAt(fRow, fCol));
  if(movetype === MoveType.PROMOTION) output += 8;
  return output;
}

/**
 * Scans all tactically relevant move pairs and returns [move, value], or
 * undefined if none are available.
 */
function selectMovePair(gamedata, color, now) {
  if(getElixirCount(gamedata.history.head, color, now) < 2) return [];
  let pairs = listMovePairs(gamedata, color, now);
  //calculate tactical value = captures + change in compute capturable
  //calculate move-based bonuses
  //set value = tactical value + moved-based bonuses / 2 minus one elixir value
  let values = [];
  let oppocolor = flipColor(color);
  let gamestate = gamedata.history.head;
  let board = gamestate.boardHistory.head;
  let legalMoveBaseline = board.listLegalMoves(color).length;
  let safeMoveBaseline = countSafeMoves(board, color);
  let oppoMoveBaseline = board.listLegalMoves(oppocolor).length;
  let oppoSafeBaseline = countSafeMoves(board, oppocolor);
  let ev = elixirValue(gamestate, color, now);
  for(let [m1, m2] of pairs) {
    let {iRow: ir1, iCol: ic1, fRow: fr1, fCol: fc1} = m1;
    let {iRow: ir2, iCol: ic2, fRow: fr2, fCol: fc2} = m2;
    let s1 = gamestate.move(m1);
    let s2 = s1.move(m2);
    let newBoard = s2.boardHistory.head;
    let captured = computeCaptured(gamestate, m1)
      + computeCaptured(gamestate.move(m1), m2);
    let tv = captured + computeCapturable(board, oppocolor) 
      - computeCapturable(newBoard, oppocolor);
    let openLinesBonus = newBoard.listLegalMoves(color).length 
      - legalMoveBaseline
    let restrictionBonus = oppoMoveBaseline 
      - newBoard.listLegalMoves(oppocolor).length
    let safeMovesBonus = countSafeMoves(newBoard, color) - safeMoveBaseline;
    let safeRestrictBonus = oppoSafeBaseline - countSafeMoves(newBoard, color);
    values.push(0.5 * (tv
      + 0.1 * openLinesBonus
      + 0.05 * restrictionBonus
      + 0.2 * safeMovesBonus
      + 0.05 * safeRestrictBonus
    ) - ev);
  }
  let i = sample(values, 1);
  return [pairs[i], values[i]];
}

function selectMove(gamedata, color, now) {
  let start = Date.now();
  let board = gamedata.getBoard();
  let oppocolor = flipColor(color);
  let gamestate = gamedata.history.head;
  let moves = listLegalMoves(gamestate, color, now);
  //for each move, compute the tactical value and if a tactic is available,
  //select among moves with positive tactical value
  let tactics = [];
  let tacticValues = [];
  let threatValues = [];
  let oppoEvs = [];
  let newBoards = [];
  let capturable = computeCapturable(board, oppocolor);
  let eStart = color === Color.WHITE ? gamestate.wStart : gamestate.bStart;
  let elixirCount = (now - eStart) / ELIXIR;
  for(let move of moves) {
    let {iRow, iCol, fRow, fCol} = move;
    let nb = board.move(iRow, iCol, fRow, fCol);
    newBoards.push(nb);
    let tacticValue = computeTacticalValue(iRow, iCol, fRow, fCol, board, nb, 
     color) + capturable;
    tacticValues.push(tacticValue);
    let threatValue = computeThreatValue(board, nb, move, color);
    threatValues.push(threatValue);
    let oppoev = elixirValue(gamestate.move(move), oppocolor, now);
    oppoEvs.push(oppoev);
  }
  //first, if any feasible threats, then select a move among them
  let candidates = [];
  if(DEBUG) console.log("scan for good threats");
  for(let i = 0; i < moves.length; i++) {
    let {iRow, iCol, fRow, fCol} = moves[i];
    let potential = threatValues[i] - tacticValues[i];
    let oppoev = oppoEvs[i];
    if(DEBUG) {
      console.log("" + iRow + iCol + fRow + fCol);
      console.log("   oev: " + oppoEvs[i]);
      console.log("   trv: " + threatValues[i]);
      console.log("   tav: " + tacticValues[i]);
      console.log("   potential: " + potential);
      console.log("   good threat? " + (threatValues[i] > 0 
       && potential > 0 && potential < oppoev));
    }
    if(threatValues[i] > 0 && potential > 0 && potential < oppoev) {
      candidates.push(i);
    }
  }
  for(let i = 0; i < moves.length; i++) {
    if(tacticValues[i] > 0) candidates.push(i);
  }
  //if no relevant tactics or threats found, then candidates includes all moves
  if(candidates.length === 0) {
    for(let i = 0; i < moves.length; i++) {
      candidates.push(i);
    }
  }
  //calculate features for each candidate move
  let values = [];
  let movesBaseline = board.listLegalMoves(color).length;
  let safeBaseline = countSafeMoves(board, color);
  let oppoMovesBaseline = board.listLegalMoves(oppocolor).length;
  let oppoSafeBaseline = countSafeMoves(board, oppocolor);
  for(let i of candidates) {
    let {iRow, iCol, fRow, fCol} = moves[i];
    let tv = tacticValues[i];
    if(threatValues[i] > 0 
     && elixirCount >= 1.7
     && threatValues[i] - tacticValues[i] > 0 
     && threatValues[i] - tacticValues[i] < oppoEvs[i]) {
      tv = threatValues[i];
    }
    let legalMoveBonus = newBoards[i].listLegalMoves(color).length 
      - movesBaseline
    let safeMoveBonus = countSafeMoves(newBoards[i], color) - safeBaseline;
    let legalRestrict = oppoMovesBaseline 
      - newBoards[i].listLegalMoves(oppocolor).length;
    let safeRestrict = oppoSafeBaseline
      - countSafeMoves(newBoards[i], oppocolor);
    if(safeRestrict === oppoSafeBaseline && elixirCount >= 1.7) {
      tv = threatValues[i];
    }
    let centerBonus = centralityBonus(iRow, iCol, fRow, fCol);
    let forward = color === Color.WHITE ? fCol - iCol : iCol - fCol;
    let castling = board.moveType(iRow, iCol, fRow, fCol) === MoveType.CASTLE ? 
      1 : 0;
    let resultantev = elixirValue(gamestate.move(moves[i]), color, now);
    //let resultantev = elixirValue(gamestate, color, now);
    if(tv < 0) {
      safeRestrict = 0;
      legalRestrict = 0;
    }
    let piece = board.pieceAt(iRow, iCol);
    if(pieceValue(piece) > 5) {
      safeRestrict /= 8;
      safeMoveBonus /= 8;
      legalMoveBonus /= 4;
      legalRestrict /= 4;
    }
    if(tv > 0) resultantev = 0;
    if(DEBUG) {
      console.log("move " + iRow + iCol + fRow + fCol);
      console.log("   tactic value: " + tacticValues[i]);
      console.log("   threat value: " + threatValues[i]);
      console.log("   tv: " + tv);
      console.log("   ev: " + resultantev);
      console.log("   oev: " + oppoEvs[i]);
    }
    values.push(tv - resultantev
      + 0.1 * centerBonus
      + 0.2 * forward
      + 0.1 * legalMoveBonus
      + 0.05 * legalRestrict
      + 0.2 * safeMoveBonus
      + 0.05 * safeRestrict
      + 3.0 * castling
    );
  }
  let result = sample(values, 1);
  let pair_result = selectMovePair(gamedata, color, now);
  let end = Date.now();
  console.log("Select took: " + (end - start) + "ms");
  if(pair_result && pair_result[1] > values[result] && pair_result[1] > 0) {
    return pair_result[0][0];
  }
  if(values[result] < 0) return undefined;
  return moves[candidates[result]];
}

if(!DEBUG) {
  connect(URL, "BOT_SOPHIE", "Iamyouroverlord", LoginType.LOGIN, undefined, 
    (socket) => {
      console.log("Connected");
      runBot(selectMove, 1000, 200, socket);
    }, (msg) => {
      console.log(msg);
    }
  );
}

export {selectMove}
