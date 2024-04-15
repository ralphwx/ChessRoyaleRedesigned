import {LoginType, URL, ELIXIR, Color, colorOf, Piece} from "../data/enums.mjs";
import {GameData, Move} from "../data/gamedata.mjs";
import {runBot} from "./bot_frame2.mjs";
import {connect} from "../frontend/metaauthclient.mjs";
import {listAttackers, listDefenders, listAttackable, pieceValue, computeFeatures, computeCapturable} from "./chess_extension_sophie.mjs";
import {ChessMap} from "../data/maps.mjs";

function flipColor(color) {
  if(color === Color.WHITE) return Color.BLACK;
  if(color === Color.BLACK) return Color.WHITE;
  throw new Error("????");
}

class BotSophie {
  elixirValue(gamestate, color, now) {
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
    console.log("evs attack: " + evs_attack);
    console.log("evs defense: " + evs_defense);
    evs_attack.sort((a, b) => {return b - a});
    evs_defense.sort((a, b) => {return b - a});
    let eStart = color === Color.WHITE ? gamestate.wStart : gamestate.bStart;
    let elixirAmount = (now - eStart) / ELIXIR + 1;
    console.log("elixir amount: " + elixirAmount);
    let index = Math.round(elixirAmount) - 1;
    if(index < 0) index = 0;
    if(index >= evs_attack.length || index >= evs_defense.length) {
      return 2 / elixirAmount;
    }
    return Math.min(evs_attack[index], evs_defense[index]);
  }
  canAfford(gamestate, iRow, iCol, fRow, fCol, now) {
    let board = gamestate.boardHistory.head;
    let color = colorOf(board.pieceAt(iRow, iCol));
    let newState = gamestate.move({iRow: iRow, iCol: iCol, fRow: fRow, 
      fCol: fCol, color: colorOf(board.pieceAt(iRow, iCol)), time: now});
    let ev = this.elixirValue(newState, color, now);
    console.log("prospective move: " + iRow + iCol + fRow + fCol);
    console.log("ev: " + ev);
    let value = this.moveValue(iRow, iCol, fRow, fCol, board);
    console.log("value: " + value);
    console.log("");
    return value >= ev;
  }
  moveValue(iRow, iCol, fRow, fCol, board) {
    let color = colorOf(board.pieceAt(iRow, iCol));
//    console.log("considering move: " + iRow + iCol + fRow + fCol);
    let features = computeFeatures(iRow, iCol, fRow, fCol, board);
 //   console.log("hanging: " + features.hanging);
    let output = 0;
    let piece = board.pieceAt(iRow, iCol);
    if(piece === Piece.W_QUEEN || piece === Piece.B_QUEEN) {
      features.legalMoveBonus /= 3;
      features.safeMovesBonus /= 3;
    }
    if(features.tacticalValue < 0) {
      features.safeRestrictBonus = 0;
      features.legalRestrictBonus = 0;
    }
    if(computeCapturable(board, color) > 0) {
      features.safeRestrictBonus /= 8;
      features.safeMovesBonus /= 8;
      features.legalMoveBonus /= 4;
      features.legalRestrictBonus /= 4;
    }
    output += 1.0 * features.tacticalValue;
    output += 0.1 * features.centerBonus;
    output += 0.2 * features.forward;
    output += 0.1 * features.legalMoveBonus;
    output += 0.05 * features.legalRestrictBonus;
    output += 0.2 * features.safeMovesBonus;
    output += 0.05 * features.safeRestrictBonus;
    output += 3.0 * features.castling;
    return output;
  }
}

console.log(import.meta.url);
console.log(process.argv[1]);
let exportMode = import.meta.url !== "file://" + process.argv[1];
if(!exportMode) {
  connect(URL, "BOT_RANDY_TEST", "TwoUsersNow!!", LoginType.LOGIN, undefined, (socket) => {
    console.log("Connected");
    let bot = new BotSophie();
    runBot(bot.moveValue, (gamestate, iRow, iCol, fRow, fCol, now) => {
      return bot.canAfford(gamestate, iRow, iCol, fRow, fCol, now)
    }, 1000, 200, socket);
  }, (msg) => {
    console.log(msg);
  });
}

export {BotSophie}
