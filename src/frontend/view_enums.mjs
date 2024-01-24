import {ChessMap} from "../data/maps.mjs";
const GameState = {
  PREPARE: 1,
  PLAY: 2,
  POST: 3,
};

class OptionalPair {
  static NONE = new OptionalPair(-1);
  static cache = ChessMap.fromInitializer((r, c) => {
    return new OptionalPair((r << 3) | c);
  });
  static create(r, c) {
    return OptionalPair.cache.get(r, c);
  }
  constructor(value) {
    this.value = value;
  }
  isPresent() {
    return this.value >= 0;
  }
  get() {
    if(!this.isPresent()) throw new Error("No value present");
    return [this.value >> 3, this.value & 7];
  }
}

const SquareType = {
  EVEN: "even",
  ODD: "odd",
  PREMOVE_SRC: "premove_init",
  PREMOVE_DEST: "premove_dest",
  SELECT: "select",
};

export {GameState, OptionalPair, SquareType};
