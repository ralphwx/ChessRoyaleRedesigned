import {Color, colorOf} from "../data/enums.mjs";
import {ChessBoard} from "./chess3.mjs";
import {ChessMap} from "./maps.mjs";
import {Move} from "./gamedata.mjs";
import {AbstractController} from "./abstract_controller.mjs";
import {GameState, OptionalPair} from "./view_enums.mjs";

/**
 * Implements [AbstractController]
 */
class Controller {
  constructor(model) {
    super();
    //md is true if the mouse is currently down
    //if mouse is down, then
    //  rightbutton is true if the right mouse button was pressed, false
    //  otherwise
    //  mr is the row where mouse press started
    //  mc is the col where mouse press started
    //  mdx is the x coordinate of where mouse press started
    //  mdy is the y coordinate of where mouse press started
    //  mcx is the current x coordinate of the mouse
    //  mcy is the current y coordinate of the mouse
    //  select is the current highlighted square
    //  premoveSrc is the start square of a premove
    //  premoveDest is the end square of a premove
    this.state = {
      md: false,
      rightbutton: false,
      dragSquare: OptionalPair.NONE,
      mdx: 0,
      mdy: 0,
      mcx: 0,
      mcy: 0,
      select: OptionalPair.NONE,
      premoveSrc: OptionalPair.NONE,
      premoveDest: OptionalPair.NONE,
    }
    this.model = model;
    this.color = this.model.getMetaData().white === username ? Color.WHITE
      : Color.BLACK;
    this.premoveThread = undefined;
  }
  gameStarted(now) {
    this.boardUpdated();
  }
  gameEnded() {
    setTimeout(() => {
      let meta = this.model.getMetaData();
      if(!meta.wready || !meta.bready) {
        alert("Game aborted");
      } else if(meta.winner === Color.WHITE) {
        alert("White wins by " + meta.cause);
      } else if(meta.winner === Color.BLACK) {
        alert("Black wins by " + meta.cause);
      } else if(meta.winner === Color.NONE) {
        alert("Drawn by " + meta.cause);
      } else {
        alert(meta.winner);
      }
    }, 500);
  }
  /**
   * Attempts to make a move.
   */
  attemptMove(iRow, iCol, fRow, fCol) {
    let board = this.repackageBoardData(this.model.getBoardData());
    let now = Date.now();
    let premoveDelay = Math.max(4000 - now + board.elixirStart,
      2000 - now + board.delay.get(iRow, iCol));
    if(premoveDelay > 0) {
      this.state.premoveSrc = OptionalPair.create(iRow, iCol);
      this.state.premoveDest = OptionalPair.create(fRow, fCol);
      this.premoveThread = setTimeout(() => {
        if(!this.state.premoveSrc.isPresent() 
          || !this.state.premoveDest.isPresent()) return;
        let [sr, sc] = this.state.premoveSrc.get();
        let [dr, dc] = this.state.premoveDest.get();
        this.attemptMove(sr, sc, dr, dc);
      }, premoveDelay);
      return;
    }
    let move = new Move(this.color, now, iRow, iCol, fRow, fCol);
    let result = this.model.tryMove(move);
    this.state.premoveSrc = OptionalPair.NONE;
    this.state.premoveDest = OptionalPair.NONE;
    if(result) {
      this.state.select = OptionalPair.create(fRow, fCol);
    } else {
      this.state.select = OptionalPair.NONE;
    }
    for(let listener of this.listeners) {
      listener.update(this.state);
    }
  }
  declareReady() {
    let now = Date.now();
    this.model.declareReady(this.color, now);
  }
  abort() {
    this.model.abort();
  }
  rematch() {
    this.model.offerRematch(this.color);
  }
  resign() {
    this.model.resign(this.color);
  }
  draw() {
    let meta = this.model.getMetaData();
    if(!meta.wready || !meta.bready || meta.cause) return;
    if((this.color === Color.WHITE && !meta.wdraw)
      || (this.color === Color.BLACK && !meta.bdraw)) {
      this.console += "Draw offer sent\n";
    }
    this.model.offerDraw(this.color);
  }
  onMouseDown(r, c, x, y, b) {
    console.log("Mouse down " + r + c);
    if(this.state.premoveSrc.isPresent()) {
      if(this.premoveThread) {
        clearInterval(this.premoveThread);
        this.premoveThread = undefined;
      }
      this.state.premoveSrc = OptionalPair.NONE;
      this.state.premoveDest = OptionalPair.NONE;
      this.state.select = OptionalPair.NONE;
    }
    let board = this.board_cache;
    if(this.state.select.isPresent() && b === 0
      && colorOf(board.pieceAt(r, c)) !== this.color) {
      let [sr, sc] = this.state.select.get();
      this.attemptMove(sr, sc, r, c);
    }
    this.state.md = true;
    this.state.rightbutton = b > 0;
    this.state.dragSquare = OptionalPair.create(r, c);
    this.state.mdx = x;
    this.state.mdy = y;
    this.state.mcx = x;
    this.state.mcy = y;
    if(!this.state.rightbutton) {
      if(colorOf(board.pieceAt(r, c)) === this.color) {
        this.state.select = OptionalPair.create(r, c);
      }
    }
    for(let listener of this.listeners) {
      listener.update(this.state);
    }
  }
  onMouseUp(r, c, x, y) {
    this.state.md = false;
    let [sr, sc] = this.state.dragSquare.get();
    if(!this.state.rightbutton && (sr !== r || sc !== c)) {
      this.attemptMove(sr, sc, r, c);
    }
    this.state.dragSquare = OptionalPair.NONE;
    for(let listener of this.listeners) {
      listener.update(this.state);
    }
  }
  onMouseMove(x, y) {
    if(this.state.md) {
      this.state.mcx = x;
      this.state.mcy = y;
      for(let listener of this.listeners) {
        listener.update(this.state);
      }
    }
  }
}

export {Controller}
