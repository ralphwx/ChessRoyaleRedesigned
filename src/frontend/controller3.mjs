
import {OptionalPair, SquareType} from "./view_enums.mjs";
import {ChessBitMap, ChessMap} from "../data/maps.mjs";
import {MoveType, colorOf, Color, ELIXIR, DELAY} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";

/**
 * Controller processes user input and model updates. It alerts the user
 * interface when the display data needs to be updated and sends appropriate
 * requests to the server.
 */
class Controller {
  constructor(model, loginType) {
    this.model = model;
    this.loginType = loginType;
    this.model.addListener(this);
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
    if(this.premoveThread) clearTimeout(this.premoveThread);
    this.premoveThread = undefined;
    this.listeners = [];
  }
  /**
   * [listener] should be an object with the same signature as the input to
   * GameModel.addListener().
   * except gameOver, which takes gameResult and cause as inputs
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  boardUpdated() {
    for(let listener of this.listeners) listener.boardUpdated();
  }
  chatUpdated() {
    for(let listener of this.listeners) listener.chatUpdated();
  }
  metaUpdated() {
    for(let listener of this.listeners) listener.metaUpdated();
  }
  gameOver() {
    for(let listener of this.listeners) {
      listener.gameOver(this.model.gameResult, this.model.cause);
    }
  }
  gameStarted() {
    for(let listener of this.listeners) listener.gameStarted();
  }
  /**
   * Returns the user's color
   */
  getColor() {
    if(this.model.user === this.model.getMetaData().black) return Color.BLACK;
    return Color.WHITE;
  }
  /**
   * Returns the current board state
   */
  getBoard() {
    let gamedata = this.model.getGameData();
    if(!gamedata) {
      return ChessBoard.startingPosition();
    }
    return gamedata.getBoard();
  }
  /**
   * Returns an object whose properties are supplied to BoardView
   */
  getViewState() {
    let color = this.getColor();
    let squareType = ChessMap.fromInitializer((r, c) => {
      if(this.viewState.highlights.get(r, c)) return SquareType.HIGHLIGHT;
      if((r ^ c) & 1) return SquareType.ODD;
      return SquareType.EVEN;
    });
    if(this.viewState.select.isPresent()) {
      let [r, c] = this.viewState.select.get();
      if(colorOf(this.getBoard().pieceAt(r, c)) === color) {
        squareType.set(r, c, SquareType.SELECT);
      }
    }
    if(this.viewState.premoveSrc.isPresent()) {
      let [r, c] = this.viewState.premoveSrc.get();
      squareType.set(r, c, SquareType.PREMOVE_SRC);
    }
    if(this.viewState.premoveDest.isPresent()) {
      let [r, c] = this.viewState.premoveDest.get();
      squareType.set(r, c, SquareType.PREMOVE_DEST);
    }
    let translate = ChessMap.fromDefault([0, 0]);
    let ms = this.mouseState;
    if(ms.mouseDown && ms.button === 0 
      && colorOf(this.getBoard().pieceAt(ms.r, ms.c)) === this.getColor()) {
      translate.set(ms.r, ms.c, [ms.currentX - ms.initX, ms.currentY - ms.initY]);
    }
    let metadata = this.model.getMetaData();
    let opponent = color === Color.WHITE ? 
      metadata.black : metadata.white;
    let userReady = color === Color.WHITE ?
      metadata.wready : metadata.bready;
    let opponentReady = color === Color.WHITE ? 
      metadata.bready : metadata.wready;
    return {
      color: this.getColor(),
      gamedata: this.model.getGameData(),
      user: this.model.user,
      userElo: this.model.userElo,
      loginType: this.loginType,
      chat: this.model.getChat(),
      opponent: opponent,
      opponentElo: this.model.opponentElo,
      userReady: userReady,
      opponentReady: opponentReady,
      userRematch: this.model.userRematch,
      opponentRematch: this.model.opponentRematch,
      gameOver: this.model.gameResult !== undefined,
      squareType: squareType,
      onMouseDown: (r, c, x, y, b) => {this.onMouseDown(r, c, x, y, b)},
      onMouseUp: (r, c, x, y) => {this.onMouseUp(r, c, x, y)},
      onMouseMove: (x, y) => {this.onMouseMove(x, y)},
      translate: translate,
      userArrows: this.viewState.userArrows,
      sendMessage: (msg) => {this.model.sendMessage(msg)},
      abort: () => {this.model.abort()},
      resign: () => {this.model.resign()},
      draw: () => {this.model.offerDraw()},
      exit: () => {console.log("redirect")},
      offerRematch: () => {this.model.offerRematch()},
      cancelRematch: () => {this.model.cancelRematch()},
      onReady: () => {this.model.declareReady()},
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
    this.viewState.premoveSrc = OptionalPair.NONE;
    this.viewState.premoveDest = OptionalPair.NONE;
    if(this.premoveThread) clearTimeout(this.premoveThread);
    this.premoveThread = undefined;
    if(b === 0) {
      this.viewState.userArrows = [];
      this.viewState.highlights = ChessBitMap.empty();
      if(colorOf(this.getBoard().pieceAt(r, c)) === this.getColor()) {
        this.viewState.select = OptionalPair.create(r, c);
      } else if(this.viewState.select.isPresent()) {
        let [iRow, iCol] = this.viewState.select.get();
        this.attemptMove(iRow, iCol, r, c);
      }
    } else if(b === 2) {
      this.viewState.select = OptionalPair.NONE;
    }
    for(let listener of this.listeners) {
      listener.boardUpdated();
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
    if(!this.mouseState.mouseDown) return;
    this.mouseState.mouseDown = false;
    if(this.mouseState.button === 0) {
      if(this.mouseState.r !== r || this.mouseState.c !== c) {
        this.attemptMove(this.mouseState.r, this.mouseState.c, r, c);
      }
    } else if(this.mouseState.button === 2) {
      if(this.mouseState.r !== r || this.mouseState.c !== c) {
        this.toggleArrow(this.mouseState.r, this.mouseState.c, r, c);
      } else {
        this.viewState.highlights.toggle(r, c);
      }
    }
    for(let listener of this.listeners) {
      listener.boardUpdated();
    }
  }
  onMouseMove(x, y) {
    if(this.mouseState.mouseDown) {
      this.mouseState.currentX = x;
      this.mouseState.currentY = y;
      for(let listener of this.listeners) {
        listener.boardUpdated();
      }
    }
  }
  attemptMove(iRow, iCol, fRow, fCol) {
    let gamedata = this.model.getGameData();
    if(gamedata === undefined) return;
    let now = Date.now();
    let gamestate = gamedata.history.head;
    //first check that you're moving your own piece
    if(colorOf(gamestate.boardHistory.head.pieceAt(iRow, iCol)) 
      !== this.getColor()) {
      return;
    }
    //check timing
    let elixirStart = this.getColor() === Color.WHITE ? 
      gamestate.wStart : gamestate.bStart;
    let delayWaitTime = DELAY - now + gamestate.delay.get(iRow, iCol);
    let elixirWaitTime = ELIXIR - now + elixirStart;
    let premoveWaitTime = Math.max(delayWaitTime, elixirWaitTime);
    if(premoveWaitTime > 0) {
      this.premoveThread = setTimeout(() => {
        this.viewState.premoveSrc = OptionalPair.NONE;
        this.viewState.premoveDest = OptionalPair.NONE;
        this.attemptMove(iRow, iCol, fRow, fCol)
      }, premoveWaitTime);
      this.viewState.select = OptionalPair.NONE;
      this.viewState.premoveSrc = OptionalPair.create(iRow, iCol);
      this.viewState.premoveDest = OptionalPair.create(fRow, fCol);
    } else {
      this.model.sendMove(iRow, iCol, fRow, fCol);
      this.viewState.select = OptionalPair.create(fRow, fCol);
    }
  }
}

export {Controller}

