
import {OptionalPair, SquareType} from "./view_enums.mjs";
import {ChessBitMap, ChessMap} from "../data/maps.mjs";
import {colorOf, Color, DELAY} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";

/**
 * Controller processes user input and model updates. It alerts the user
 * interface when the display data needs to be updated and sends appropriate
 * requests to the server.
 */
class Controller {
  constructor() {
    this.color = Color.WHITE;
    this.mouseState = {
      mouseDown: false,
      button: 0,
      r: -1,
      c: -1,
      initX: 0,
      initY: 0,
      currentX: 0,
      currentY: 0,
    }
    this.viewState = {
      select: OptionalPair.NONE,
      premoveSrc: OptionalPair.NONE,
      premoveDest: OptionalPair.NONE,
      userArrows: [],
      highlights: ChessBitMap.empty(),
    }
    this.premoveThread = undefined;
    this.pendingMove = undefined;
    this.board = ChessBoard.startingPosition();
  }
  /**
   * Returns an object whose properties are supplied to BoardView
   */
  getViewState() {
    let squareType = ChessMap.fromInitializer((r, c) => {
      if(this.viewState.highlights.get(r, c)) return SquareType.HIGHLIGHT;
      if((r ^ c) & 1) return SquareType.ODD;
      return SquareType.EVEN;
    });
    if(this.viewState.select.isPresent()) {
      let [r, c] = this.viewState.select.get();
      squareType.set(r, c, SquareType.SELECT);
    }
    if(this.viewState.premoveSrc.isPresent()) {
      let [r, c] = this.viewState.premoveSrc.get();
      squareType.set(r, c, SquareType.PREMOVE_SRC);
    }
    if(this.viewState.premoveDest.isPresent()) {
      let [r, c] = this.viewState.premoveSrc.get();
      squareType.set(r, c, SquareType.PREMOVE_DEST);
    }
    return {
      color: this.color,
      board: ChessBoard.startingPosition(),
      delay: ChessMap.fromDefault(Date.now() - DELAY),
      squareType: squareType,
      onMouseDown: (r, c, x, y, b) => {this.onMouseDown(r, c, x, y, b)},
      onMouseUp: (r, c, x, y) => {this.onMouseUp(r, c, x, y)},
      onMouseMove: (x, y) => {this.onMouseMove(x, y)},
      translate: ChessMap.fromDefault([0, 0]),
      moveArrows: [],
      userArrows: this.viewState.userArrows,
    };
  }
  onMouseDown(r, c, x, y, b) {
    this.mouseState.mouseDown = true;
    this.mouseState.button = b;
    this.mouseState.r = r;
    this.mouseState.c = c;
    this.mouseState.initX = x;
    this.mouseState.initY = y;
    this.mouseState.currentX = x;
    this.mouseState.currentY = y;
    if(b === 0) {
      console.log("left mouse button pressed" + r + c);
      this.viewState.premoveSrc = OptionalPair.NONE;
      this.viewState.premoveDest = OptionalPair.NONE;
      this.viewState.userArrows = [];
      this.viewState.highlights = ChessBitMap.empty();
      this.pendingMove = undefined;
      this.premoveThread = undefined;
      if(colorOf(this.board.pieceAt(r, c)) === this.color) {
        this.viewState.select = OptionalPair.create(r, c);
        return;
      }
      if(this.viewState.select.isPresent()) {
        //attempt move
        return;
      }
    } else if(b === 2) {
      this.viewState.select = OptionalPair.NONE;
      this.viewState.premoveSrc = OptionalPair.NONE;
      this.viewState.premoveDest = OptionalPair.NONE;
      this.premoveThread = undefined;
      this.pendingMove = undefined;
      console.log("right mouse button pressed");
    } else {
      console.log("something else was pressed, idk");
    }
  }
  toggleArrow(iRow, iCol, fRow, fCol) {
    let list = this.viewState.userArrows;
    let spliced = false;
    for(let i = list.length - 1; i >= 0; i--) {
      let candidate = list[i];
      if(candidate.iRow === iRow && candidate.iCol === iCol
        && candidate.fRow === fRow && candidate.fCol === fCol) {
        list.splice(i, 1);
        spliced = true;
      }
    }
    if(!spliced) {
      list.push({iRow: iRow, iCol: iCol, fRow: fRow, fCol: fCol});
    }
  }
  onMouseUp(r, c, x, y) {
    console.log("mouse up " + r + c);
    if(!this.mouseState.mouseDown) return;
    this.mouseState.mouseDown = false;
    if(this.mouseState.button === 0) {
      if(this.viewState.select.isPresent()) {
        if(this.mouseState.r !== r && this.mouseState.c !== c) {
          //attempt move
        }
      }
    } else if(this.mouseState.button === 2) {
      if(this.mouseState.r !== r || this.mouseState.c !== c) {
        this.toggleArrow(this.mouseState.r, this.mouseState.c, r, c);
      } else {
        this.viewState.highlights.toggle(r, c);
      }
    }
  }
  onMouseMove(x, y) {
    if(this.mouseState.mouseDown) {
      this.mouseState.currentX = x;
      this.mouseState.currentY = y;
    }
  }
}

export {Controller}

