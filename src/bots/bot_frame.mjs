
import {Color, Location, ELIXIR} from "../data/enums.mjs";
import {GameModel} from "../frontend/game_model.mjs";
import {Move} from "../data/gamedata.mjs";
import {Mutex} from "async-mutex";

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
 * [elixirValue] should take the amount of elixir available as input and return
 * a float as output
 * [temperature] should be a positive (non-zero) float; larger values correspond
 * to a more random move selection.
 * returns: {iRow, iCol, fRow, fCol} or undefined.
 * 
 * A move will be sampled from the Maxwell-Boltzmann distribution among the
 * legal moves, with higher probabilities assigned to higher value moves. Then,
 * if the move's value exceeds the value of one elixir, then that move is 
 * returned. Otherwise, no move is returned.
 */
function selectMove(gamedata, color, moveValue, elixirValue, temperature) {
  let now = Date.now();
  let board = gamedata.getBoard();
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
  if(values[i] < elixirValue(elixirCount) && elixirCount < 9) return undefined;
  let [iRow, iCol, fRow, fCol] = moves[i];
  return {iRow: iRow, iCol: iCol, fRow: fRow, fCol: fCol}
}

/**
 * Calls a function at regular intervals, but is allowed to fast-track the
 * function call in the event of a disturbance
 */
class Scheduler {
  /**
   * [fn] is the function to be called, [interval] is the normal delay between
   * function calls, [reactionTime] is how long the Scheduler waits before
   * calling the function in response to a disturbance. The first function call
   * waits [delay] before being called.
   */
  constructor(fn, interval, reactionTime) {
    this.fn = fn;
    this.interval = interval;
    this.reactionTime = reactionTime;
    this.callingThread = undefined;
    this.mutex = new Mutex();
  }
  execute() {
    this.mutex.runExclusive(() => {
      this.fn();
      this.callingThread = setTimeout(() => {this.execute()}, this.interval);
    });
  }
  react() {
    this.mutex.runExclusive(() => {
      clearTimeout(this.callingThread);
      this.callingThread = setTimeout(() => {this.execute()}, 
        this.reactionTime);
    });
  }
  /**
   * Begins the execution cycle
   */
  start() {
    this.mutex.runExclusive(() => {
      clearTimeout(this.callingThread);
      this.execute();
    });
  }
  /**
   * Stops the execution cycle
   */
  stop() {
    this.mutex.runExclusive(() => {
      clearTimeout(this.callingThread);
    });
  }
}

function runBot(moveValue, elixirValue, interval, reactionTime, socket) {
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
    let color = game_model.metadata.white === game_model.user ? 
      Color.WHITE : Color.BLACK;
    let move = selectMove(game_model.gamedata, color, moveValue, elixirValue, 1);
    if(move) {
      socket.notify("move", move, (meta, args) => {});
    }
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

function runBotLocal(moveValue, elixirValue, interval, reactionTime, 
  servergame, username) {
  let moveLoop = () => {
    let color = servergame.white === username ? 
      Color.WHITE : Color.BLACK;
    let move = selectMove(servergame.gameState, color, moveValue, elixirValue, 1);
    if(move) {
      let {iRow, iCol, fRow, fCol} = move;
      servergame.move(iRow, iCol, fRow, fCol, color, Date.now());
    }
  }
  let scheduler = new Scheduler(moveLoop, interval, reactionTime);
  servergame.addListener({
    metaUpdate: () => {},
    boardUpdate: () => {scheduler.react()},
    chatUpdate: () => {},
    gameOver: () => {scheduler.stop();},
    gameStarted: () => {scheduler.start();},
  });
  servergame.setReady(username);
}

export {runBot, runBotLocal, Scheduler}
