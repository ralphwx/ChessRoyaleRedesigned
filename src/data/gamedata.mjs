import {List} from "immutable";
import {HTList} from "./htlist.mjs";
import {ImChessMap} from "./maps.mjs";
import {ChessBoard} from "./chess.mjs";
import {Piece, Color, MoveType, colorOf, DELAY, ELIXIR, BAR_MAX} from "./enums.mjs";
const RESOURCE_TIME = ELIXIR;
const MAX_RESOURCE = BAR_MAX;

//Struct for single moves
class Move {
  constructor(color, time, iRow, iCol, fRow, fCol) {
    this.time = time;
    this.iRow = iRow;
    this.iCol = iCol;
    this.fRow = fRow;
    this.fCol = fCol;
    this.color = color;
  }
}

/*
 * GameState represents the state of a ChessRoyale game at a certain point
 * in time. Most attributes are self-explanatory, but some additional
 * clarification:
 *   [delay.get(i, j)] is the most recent time a piece landed on square(i, j)
 *   [moveHistory] is an HTList containing the history of moves, where [head]
 *     is the most recent move
 *   [boardHistory] is an HTList containing the history of board states, where
 *     [head] is the current board state. The length of [boardHistory] is one
 *     greater than the number of moves in [moveHistory], since each move
 *     corresponds to a board state, but there is also the starting board
 *     state before any moves have been played.
 *   [gameOver] is Color.WHITE if the black king has been removed from the 
 *     board, is Color.BLACK if the white king has been removed from the board,
 *     or Color.NONE otherwise.
 * Client classes should not use the constructor, instead use GameState.initial
 *   to construct the starting state or GameState.move to get later game states
 */
const BOARD_HISTORY_START = HTList.cons(ChessBoard.startingPosition(), 
  HTList.NIL);
class GameState {
  static initial(startTime) {
    return new GameState(startTime, startTime, startTime, 
      ImChessMap.fromDefault(startTime - 2 * DELAY), HTList.NIL, BOARD_HISTORY_START);
  }
  constructor(start, wstart, bstart, delay, moveHistory, boardHistory) {
    this.currentTime = start;
    this.wStart = wstart;
    this.bStart = bstart;
    this.delay = delay; 
    this.moveHistory = moveHistory;
    this.boardHistory = boardHistory;
    this.gameOver = this.checkGameOver();
  }
  /**
   * Converts this GameState to string, for debugging purposes.
   */
  toString() {
    let output = [];
    output.push("{\n");
    output.push("  wStart: " + this.wStart + "\n");
    output.push("  bStart: " + this.bStart + "\n");
    output.push("  moveHistory: [\n");
    let move = this.moveHistory;
    while(!move.isNil()) {
      output.push("    ");
      output.push(JSON.stringify(move.head));
      output.push(", \n");
      move = move.tail;
    }
    output.push("  ]\n");
    output.push("}");
    return output.join("");
  }
  /**
   * Helper function
   */
  checkGameOver() {
    let wking = false;
    let bking = false;
    let board = this.boardHistory.head;
    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 8; j++) {
        if(board.pieceAt(i, j) === Piece.W_KING) wking = true;
        if(board.pieceAt(i, j) === Piece.B_KING) bking = true;
      }
    }
    if(!wking) return Color.BLACK;
    if(!bking) return Color.WHITE;
    return Color.NONE;
  }
  /*
   * checks whether making move [move] is legal in the current game state, 
   * taking into account whether the corresponding player is moving their own 
   * piece, whether they have sufficient elixir, whether the piece is still 
   * under motion sickness, and whether it's a legal move given the board state.
   *
   * Requires [move] to be of type [Move]
   */
  isLegalMove(move) {
    let board = this.boardHistory.head;
    //need to check for color, elixir, delay, gameover, and board state
    if(this.gameOver !== Color.NONE) return false;
    if(colorOf(board.pieceAt(move.iRow, move.iCol)) !== move.color) {
      return false;
    }
    let startTime = move.color === Color.WHITE ? this.wStart : this.bStart;
    if(move.time - startTime < RESOURCE_TIME) {
      return false;
    }
    if(move.time - this.delay.get(move.iRow, move.iCol) < DELAY) {
      return false;
    }
    if(board.moveType(move.iRow, move.iCol, move.fRow, move.fCol) 
      === MoveType.INVALID) {
      return false;
    }
    return true;
  }
  /**
   * Makes move [move] on the current game state and returns a new GameState
   * representing the result. Require [move] to be of type [Move] and be a
   * legal move.
   */
  move(move) {
    let nwStart = Math.max(this.wStart, move.time - MAX_RESOURCE * RESOURCE_TIME);
    let nbStart = Math.max(this.bStart, move.time - MAX_RESOURCE * RESOURCE_TIME);
    if(move.color === Color.WHITE) nwStart += RESOURCE_TIME;
    if(move.color === Color.BLACK) nbStart += RESOURCE_TIME;
    let nDelay = this.delay.set(move.fRow, move.fCol, move.time);
    let nmHistory = HTList.cons(move, this.moveHistory);
    let nbHistory = HTList.cons(this.boardHistory.head.move(move.iRow, move.iCol, move.fRow, move.fCol), 
      this.boardHistory);
    return new GameState(move.time, nwStart, nbStart, nDelay, nmHistory, nbHistory);
  }
}

/**
 * GameData class keeps track of the history of GameStates and notifies
 * listeners when the game state changes.
 * 
 * Client classes should use the constructor to construct the starting game
 * state and use GameData.move() to construct later game states.
 */
class GameData {
  constructor(start) {
    this.startTime = start;
    this.history = HTList.cons(GameState.initial(start), HTList.NIL);
    this.listeners = [];
  }
  /**
   * Adds a listener [func] to this GameData object, where [func] takes two
   * arguments [i] and [list], where [i] is the index of the first timestep that
   * requires change and [list] is the new list of moves made starting from
   * that state.
   */
  addListener(func) {
    this.listeners.push(func);
  }
  /**
   * Convenience function for getting the current board state
   */
  getBoard() {
    return this.history.head.boardHistory.head;
  }
  /**
   * Helper function that returns [i, s] such that the [i]th element in
   * [this.history] has a timestamp less than or equal to the timestamp of
   * [move], and [s] is the [i]th element of this.history. [s] is an HTList
   * If no such [i] can be found, then [-1, undefined] is returned.
   */
  findStartState(move) {
    let i = 0;
    let s = this.history;
    while(!s.isNil() && s.head.currentTime > move.time) {
      s = s.tail;
      i += 1;
    }
    if(s.isNil()) return [-1, undefined];
    return [i, s];
  }
  /**
   * Returns whether [move] is a legal move. Requires [move] to be of type
   * [Move].
   */
  isLegalMove(move) {
    if(this.gameOver()) return false;
    let [i, s] = this.findStartState(move);
    if(i === -1) return false;
    return s.head.isLegalMove(move);
  }
  /**
   * Returns whether one of the kings has been captured.
   */
  gameOver() {
    return this.history.head.gameOver !== Color.NONE;
  }
  /**
   * Attempts to make move [move] for this current game state. If [move] is not
   * legal, then nothing happens. Require [move] to be of type [Move]
   */
  move(move) {
    if(!this.isLegalMove(move)) return;
    let [i, s] = this.findStartState(move);
    let ss = this.history;
    let moveQueue = [];
    for(let k = 0; k < i; k++) {
      moveQueue.push(ss.head.moveHistory.head);
      ss = ss.tail;
    }
    moveQueue.push(move);
    let lastState = s.head;
    let newHistory = [];
    for(let j = moveQueue.length - 1; j >= 0; j--) {
      if(lastState.isLegalMove(moveQueue[j])) {
        lastState = lastState.move(moveQueue[j]);
        newHistory.push(lastState);
      }
    }
    this.rewriteHistory(i, newHistory);
  }
  //helper function for modifying this.history
  rewriteHistory(i, newHistory) {
    let outi = this.history.length - i;
    let outMoves = [];
    for(let k = 0; k < i; k++) {
      this.history = this.history.tail;
    }
    for(let newState of newHistory) {
      this.history = HTList.cons(newState, this.history);
      outMoves.push(newState.moveHistory.head);
    }
    for(let l of this.listeners) {
      l(outi, outMoves);
    }
  }
  /**
   * Removes the last [i] states from this game's history, then makes the
   * moves [newMoves]
   */
  rewriteMoves(i, newMoves) {
    let startState = this.history;
    let outi = startState.length - i;
    for(let k = 0; k < i; k++) startState = startState.tail;
    for(let move of newMoves) {
      let newState = startState.head.move(move);
      startState = HTList.cons(newState, startState);
    }
    this.history = startState;
    for(let l of this.listeners) {
      l(outi, newMoves);
    }
  }
  /**
   * Returns the list of all [Move] objects in the history, starting from
   * the [i]th move (inclusive, index starting from zero). If [i] is out of
   * bounds, empty list is returned; if [i] is negative, [i] is treated as 0.
   */
  movesSince(i) {
    let h = this.history.head.moveHistory;
    let output = [];
    while(!h.isNil() && h.length > i) {
      output.push(h.head);
      h = h.tail;
    }
    return output.reverse();
  }
  /**
   * Converts this object to a string for debugging purposes.
   */
  toString() {
    let output = [];
    let h = this.history;
    while(!h.isNil()) {
      output.push(h.head.toString());
      h = h.tail;
    }
    return output.join("\n");
  }
}

export {Move, GameData};
