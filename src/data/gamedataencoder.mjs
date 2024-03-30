
import {GameData, Move} from "./gamedata.mjs";
import {colorOf} from "./enums.mjs";
/**
 * This module contains functions for converting gamedata objects to string and
 * back again.
 */

/**
 * Converts a 6-bit unsigned integer to a single character.
 */
function intToChar(i) {
  if(i < 26) return String.fromCharCode("a".charCodeAt(0) + i);
  if(i < 52) return String.fromCharCode("A".charCodeAt(0) + i - 26);
  if(i < 62) return "" + (i - 52);
  if(i === 62) return "(";
  return ")";
}

/**
 * Converts a character to a 6-bit integer
 */
function charToInt(c) {
  if("a" <= c && c <= "z") return c.charCodeAt(0) - "a".charCodeAt(0);
  if("A" <= c && c <= "Z") return c.charCodeAt(0) - "A".charCodeAt(0) + 26;
  if("0" <= c && c <= "9") return c.charCodeAt(0) - "0".charCodeAt(0) + 52;
  if(c === "(") return 62;
  return 63;
}

/**
 * Converts a time in milliseconds to a string
 */
function encodeTime(time) {
  if(time < 0) throw new Error("Cannot encode negative time");
  if(time === 0) return intToChar(0);
  let output = [];
  while(time > 0) {
    output.push(time & 31);
    time = time >> 5;
  }
  for(let i = 1; i < output.length; i++) output[i] = output[i] | 32;
  output.reverse();
  return output.map(intToChar).join("");
}

/**
 * Encodes a gamedata object
 */
function encodeGameData(gamedata) {
  let movePointer = gamedata.history.head.moveHistory;
  let moves = [];
  //iterating through movePointer processes moves in reverse order, so first
  //reverse the order.
  while(!movePointer.isNil()) {
    moves.push(movePointer.head);
    movePointer = movePointer.tail;
  }
  moves.reverse();
  let startTime = gamedata.startTime;
  let output = [];
  for(let {iRow, iCol, fRow, fCol, time} of moves) {
    output.push(encodeTime(Math.floor(time - startTime)));
    output.push(intToChar((iRow << 3) | iCol));
    output.push(intToChar((fRow << 3) | fCol));
  }
  return output.join("");
}

/**
 * An iterator over a string with one character lookahead buffer
 */
class StringScanner {
  constructor(string) {
    this.content = string;
    this.position = 0;
  }
  hasNext() {
    return this.position < this.content.length;
  }
  next() {
    let output = this.content[this.position];
    this.position++;
    return output;
  }
  peek() {
    return this.content[this.position];
  }
}

/**
 * Reads some characters from scanner, interpreting it as a timestamp.
 * Returns the timestamp and consumes the corresponding characters
 * in [scanner].
 */
function readTime(scanner) {
  let output = 0;
  while(true) {
    let next = charToInt(scanner.next());
    output = (output << 5) | (next & 31);
    if((next & 32) === 0) break;
  }
  return output;
}

/**
 * Reads some characters from scanner, interpreting it as a move.
 * Returns {iRow, iCol, fRow, fCol} corresponding to the move
 * and consumes the corresponding characters in [scanner]
 */
function readMove(scanner) {
  let i = charToInt(scanner.next());
  let f = charToInt(scanner.next());
  return {
    iRow: i >> 3,
    iCol: i & 7,
    fRow: f >> 3,
    fCol: f & 7,
  };
}

/**
 * Takes a compressed string encoding of a gamedata object and reconstructs
 * the original gamedata object.
 * WARNING: if [string] is not a valid representation of a gamedata object,
 * this function WILL CRASH.
 */
function decodeGameData(string) {
  let scanner = new StringScanner(string);
  let output = new GameData(0);
  while(scanner.hasNext()) {
    let time = readTime(scanner);
    let {iRow, iCol, fRow, fCol} = readMove(scanner);
    let color = colorOf(output.getBoard().pieceAt(iRow, iCol));
    let move = new Move(color, time, iRow, iCol, fRow, fCol);
    if(output.isLegalMove(move)) output.move(move);
    else throw new Error("Illegal move detected");
  }
  return output;
}

//let gamedata = new GameData(0);
//gamedata.move(new Move(Color.WHITE, 4001, 1, 4, 3, 4));
//
//let encoded = encodeGameData(gamedata);
//console.log(encoded);
//let decoded = decodeGameData(encoded);
//console.log("Finished");
export {encodeGameData, decodeGameData}
