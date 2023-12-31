import {List} from "immutable";

/**
 * Collection of useful data structures
 */

/**
 * ChessMap is a mapping from (r, c) pairs to values, where [r] and [c] are
 * both between 0 and 7, inclusive.
 */
class ChessMap {
  //fn is a function mapping (r, c) => value
  static fromInitializer(fn) {
    let list = [];
    for(let i = 0; i < 64; i++) {
      list.push(fn(i >> 3, i & 7));
    }
    return new ChessMap(list);
  }
  static fromList(list) {
    return new ChessMap(list);
  }
  static fromDefault(default_value) {
    let list = [];
    for(let i = 0; i < 64; i++) {
      list.push(default_value);
    }
    return new ChessMap(list);
  }
  constructor(list) {
    this.data = list;
  }
  get(r, c) {
    return this.data[(r << 3) | c];
  }
  set(r, c, v) {
    this.data[(r << 3) | c] = v;
  }
  copy() {
    let datacopy = [];
    for(let datum of this.data) {
      if(datum.copy !== undefined) {
        datacopy.push(datum.copy());
      } else datacopy.push(datum);
    }
    return new ChessMap(datacopy);
  }
}

/**
 * ChessBitMap is a map from (r, c) pairs to binary digits {0, 1}, where
 * [r] and [c] are between 0 and 7 inclusive.
 */
class ChessBitMap {
  static empty() {
    return new ChessBitMap(0, 0);
  }
  constructor(low, high) {
    this.low = low;
    this.high = high;
  }
  isAllZero() {
    return this.low === 0 && this.high === 0;
  }
  get(i, j) {
    if(i >> 2) return (this.high >> ((i << 3) | j)) & 1;
    return (this.low >> (((i & 3) << 3) | j)) & 1;
  }
  set(i, j, b) {
    if(b) {
      if(i >> 2) {
        this.high = this.high | (1 << (((i & 3) << 3) | j));
      } else {
        this.low = this.low | (1 << ((i << 3) | j));
      }
    } else {
      if(i >> 2) {
        this.high = this.high & ~(1 << (((i & 3) << 3) | j));
      } else {
        this.low = this.low & ~(1 << ((i << 3) | j));
      }
    }
  }
  copy() {
    return new ChessBitMap(this.low, this.high);
  }
}

/**
 * LegalMoveMap is a map from [ir, ic, fr, fc] 4-tuples to binary digits
 * {0, 1}, where all four elements of the 4-tuple are between 0 and 7
 * inclusive.
 */
class LegalMoveMap {
  static empty() {
    return new LegalMoveMap(ChessMap.fromInitializer(() => {
      return ChessBitMap.empty()}));
  }
  constructor(map) {
    this.data = map;
  }
  get(iRow, iCol, fRow, fCol) {
    return this.data.get(iRow, iCol).get(fRow, fCol);
  }
  set(iRow, iCol, fRow, fCol, value) {
    this.data.get(iRow, iCol).set(fRow, fCol, value);
  }
  zero(iRow, iCol) {
    this.data.set(iRow, iCol, ChessBitMap.empty());
  }
  copy() {
    return new LegalMoveMap(this.data.copy());
  }
  toList() {
    let output = [];
    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 8; j++) {
        if(this.data.get(i, j).isAllZero()) continue;
        for(let r = 0; r < 8; r++) {
          for(let c = 0; c < 8; c++) {
            if(this.data.get(i, j).get(r, c)) output.push([i, j, r, c]);
          }
        }
      }
    }
    return output;
  }
}

/**
 * MultiMap is a map from single keys ("users") to multiple values ("sockets")
 */
class MultiMap {
  constructor() {
    this.map = new Map();
  }
  get(user) {
    let output = this.map.get(user);
    if(output === undefined) return [];
    return output;
  }
  add(user, socket) {
    let ls = this.map.get(user);
    if(ls === undefined) {
      this.map.set(user, [socket]);
      return;
    }
    if(ls.indexOf(socket) !== -1) throw "socket already added";
    ls.push(socket);
  }
  remove(user, socket) {
    let ls = this.map.get(user);
    if(ls === undefined) throw "nothing to remove";
    let index = ls.indexOf(socket);
    if(index === -1) throw "cannot remove";
    if(ls.length === 1) this.map.delete(user);
    else ls.splice(index, 1);
  }
}

/**
 * Immutable data structure mapping pairs (i, j) to values, where [i] and [j]
 * are integers between 0 and 7 inclusive
 */
class ImChessMap {
  static fromDefault(defaultValue) {
    let temp = [];
    for(let i = 0; i < 64; i++) temp.push(defaultValue);
    return new ImChessMap(new List(temp));
  }
  constructor(list) {
    this.data = list;
  }
  get(i, j) {
    return this.data.get((i << 3) | j);
  }
  set(i, j, v) {
    return new ImChessMap(this.data.set((i << 3) | j, v));
  }
}

export {ChessMap, ChessBitMap, LegalMoveMap, MultiMap, ImChessMap};
