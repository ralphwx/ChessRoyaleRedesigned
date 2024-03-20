
import {OptionalPair, SquareType} from "./view_enums.mjs";
import {ChessBitMap, ChessMap} from "../data/maps.mjs";
import {URL, colorOf, Color, LoginType} from "../data/enums.mjs";
import {ChessBoard} from "../data/chess.mjs";

/**
 * SpectatorController is the controller for spectator mode. It performs all the
 * same functions as [Controller] but removes the user's ability to perform
 * inputs.
 */
class SpectatorController {
  constructor(model, user, lagEstimator) {
    this.user = user;
    this.model = model;
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
      userArrows: [],
      highlights: ChessBitMap.empty(),
    }
    this.listeners = [];
    this.lagEstimator = lagEstimator;
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
      loginUser: this.user,
      user: this.model.user,
      userElo: this.model.userElo,
      loginType: LoginType.SPECTATE,
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
      sendMessage: (msg) => {},
      abort: () => {},
      resign: () => {},
      draw: () => {},
      exit: () => {window.location.replace(URL)},
      offerRematch: () => {},
      cancelRematch: () => {},
      onReady: () => {},
      now: Date.now() - this.lagEstimator.getMax(),
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
    this.viewState.select = OptionalPair.NONE;
  }
}

export {SpectatorController}

