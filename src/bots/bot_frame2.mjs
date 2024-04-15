
import {Color, Location, ELIXIR, DELAY} from "../data/enums.mjs";
import {GameModel} from "../frontend/game_model.mjs";
import {Move} from "../data/gamedata.mjs";
import {Mutex} from "async-mutex";
import {printBoard} from "../tests/test_framework.mjs";
import {Scheduler} from "./scheduler.mjs";

/**
 * Scales each element of [probs] so that the list adds to 1
 */
function normalize(probs) {
  let sum = 0;
  for(let p of probs) sum += p;
  for(let i = 0; i < probs.length; i++) probs[i] /= sum;
}

/** 
 * Takes a list of probabilities as input, samples an index accordingly
 */
function sample(probs) {
  let target = Math.random();
  for(let i = 0; i < probs.length - 1; i++) {
    target -= probs[i];
    if(target < 0) return i;
  }
  return probs.length - 1;
}

function getElixirCount(gamedata, now, color) {
  if(color === Color.WHITE) {
    return (now - gamedata.history.head.wStart) / ELIXIR;
  }
  if(color === Color.BLACK) {
    return (now - gamedata.history.head.bStart) / ELIXIR;
  }
  throw new Error("Invalid color: " + color);
}

/**
 * Selects a move given the current game state for the player of color [color],
 * using move evaluation function [moveValue], elixir evaluation function
 * [elixirValue], and noisiness parameter [temperature].
 * [moveValue] should take (iRow, iCol, fRow, fCol, board) as input, returning
 * a float as output
 * [elixirCheck] should take gamestate, iRow, iCol, fRow, fCol, now and return
 * whether it's feasible to spend the elixir on making that move.
 * [temperature] should be a positive (non-zero) float; larger values correspond
 * to a more random move selection.
 * returns: {iRow, iCol, fRow, fCol} or undefined.
 * 
 * A move will be sampled from the Maxwell-Boltzmann distribution among the
 * legal moves, with higher probabilities assigned to higher value moves. Then,
 * if the move's value exceeds the value of one elixir, then that move is 
 * returned. Otherwise, no move is returned.
 */
function selectMove(gamedata, color, moveValue, elixirCheck, temperature) {
  let now = Date.now();
  let board = gamedata.getBoard();
  //console.log("Received board");
  //printBoard(board);
  let moves = board.listLegalMoves(color);
  if(moves.length === 0) return undefined;
  let values = [];
  let max_value = -100;
  for(let [iRow, iCol, fRow, fCol] of moves) {
    let move = new Move(color, now, iRow, iCol, fRow, fCol);
    if(!gamedata.isLegalMove(move)) values.push(-100);
    else {
      let value = moveValue(iRow, iCol, fRow, fCol, board);
      values.push(value);
      if(value > max_value) max_value = value;
    }
  }
  let probabilities = [];
  for(let value of values) {
    probabilities.push(Math.exp((value - max_value) / temperature));
  }
  normalize(probabilities);
  let i = sample(probabilities);
  let elixirCount = getElixirCount(gamedata, now, color);
  let [iRow, iCol, fRow, fCol] = moves[i];
  let ec = elixirCheck(gamedata.history.head, iRow, iCol, fRow, fCol, now);
  if((elixirCount < 9) && !ec) {
    return undefined;
  }
  return {iRow: iRow, iCol: iCol, fRow: fRow, fCol: fCol}
}

function runBot(moveValue, elixirCheck, interval, reactionTime, socket) {
  let game_model = new GameModel(socket.user, socket);
  socket.notify("redirect?", {}, (meta, args) => {
    if(args === Location.GAME) {
      socket.notify("declareReady", {}, (meta, args) => {});
    } else {
      socket.notify("createOpenChallenge", {}, () => {});
    }
  });
  socket.addEventHandler("joined", (meta, args) => {
    game_model.refreshGameData();
    socket.notify("declareReady", {}, (meta, args) => {});
  });
  let moveLoop = () => {
    if(!game_model || !game_model.gamedata) {
      return [];
    }
    let color = game_model.metadata.white === game_model.user ? 
      Color.WHITE : Color.BLACK;
    let gamestate = game_model.gamedata.history.head;
    let eStart = color === Color.WHITE ? gamestate.wStart : gamestate.bStart;
    let now = Date.now();
    let elixirAmount = (now - eStart) / ELIXIR;
    if(elixirAmount < 1) {
      return [eStart + ELIXIR];
    }
    let move = selectMove(game_model.gamedata, color, moveValue, elixirCheck, 0.1);
    if(move) {
      socket.notify("move", move, (meta, args) => {});
      return [Math.max(now + DELAY, eStart + 2 * ELIXIR)];
    }
    return [];
  }
  let scheduler = new Scheduler(moveLoop, interval, reactionTime);
  game_model.addListener({
    metaUpdated: () => {},
    boardUpdated: () => {scheduler.react()},
    chatUpdated: () => {},
    gameOver: () => {
      scheduler.stop(); 
      socket.notify("createOpenChallenge", {}, () => {});
    },
    gameStarted: () => {scheduler.start();},
  });
}

//function runBotLocal(moveValue, elixirValue, interval, reactionTime, 
//  servergame, username) {
//  let moveLoop = () => {
//    let color = servergame.white === username ? 
//      Color.WHITE : Color.BLACK;
//    let move = selectMove(servergame.gameState, color, moveValue, elixirValue, 1);
//    if(move) {
//      let {iRow, iCol, fRow, fCol} = move;
//      let now = Date.now();
//      servergame.move(iRow, iCol, fRow, fCol, color, now);
//      return [now + DELAY];
//    }
//    return [];
//  }
//  let scheduler = new Scheduler(moveLoop, interval, reactionTime);
//  servergame.addListener({
//    metaUpdate: () => {},
//    boardUpdate: () => {scheduler.react()},
//    chatUpdate: () => {},
//    gameOver: () => {scheduler.stop();},
//    gameStarted: () => {scheduler.start();},
//  });
//  servergame.setReady(username);
//}

export {runBot, Scheduler, selectMove}
