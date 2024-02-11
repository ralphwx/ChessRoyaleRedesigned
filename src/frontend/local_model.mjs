
import {Color} from "../data/enums.mjs";

/**
 * GameModel, but interacts with a local ServerGame object instead of through
 * the server.
 */
class LocalModel {
  constructor(user, servergame, userElo, opponentElo) {
    this.user = user;
    this.gameResult = undefined;
    this.cause = undefined;
    this.listeners = [];
    this.userElo = userElo;
    this.opponentElo = opponentElo;
    this.userRematch = false;
    this.opponentRematch = true;

    this.servergame = servergame;
    this.servergame.addListener(this);
  }
  /**
   * Listener functionality
   */
  boardUpdate() {
    for(let listener of this.listeners) listener.boardUpdated();
  }
  chatUpdate() {
    for(let listener of this.listeners) listener.chatUpdated();
  }
  metaUpdate() {
    for(let listener of this.listeners) listener.metaUpdated();
  }
  gameOver(data) {
    this.gameResult = data.gameOverResult;
    this.cause = data.gameOverCause;
    for(let listener of this.listeners) listener.gameOver();
  }
  gameStarted(now) {
    for(let listener of this.listeners) listener.gameStarted();
  }
  getGameData() {
    return this.servergame.gameState;
  }
  getMetaData() {
    return {
      white: this.servergame.white,
      black: this.servergame.black,
      wready: this.servergame.wready,
      bready: this.servergame.bready,
      wdraw: this.servergame.wdraw,
      bdraw: this.servergame.bdraw,
    }
  }
  getChat() {
    return this.servergame.chat.getSince(0);
  }
  addListener(listener) {
    this.listeners.push(listener);
  }
  getColor() {
    if(this.servergame.white === this.user) return Color.WHITE;
    return Color.BLACK;
  }
  sendMove(iRow, iCol, fRow, fCol) {
    let color = this.getColor();
    let now = Date.now();
    this.servergame.move(iRow, iCol, fRow, fCol, color, now);
  }
  sendMessage(msg) {
    this.servergame.chatMessage(this.user, msg);
  }
  abort() {
    this.servergame.abort();
  }
  resign() {
    this.servergame.resign(this.user);
  }
  offerDraw() {
    this.servergame.drawOffer(this.user);
  }
  offerRematch() {
    window.location.reload(true);
  }
  cancelRematch() {
    //do nothing
  }
  declareReady() {
    this.servergame.setReady(this.user);
  }
}

export {LocalModel}
