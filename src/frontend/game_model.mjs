
import {GameData} from "../data/gamedata.mjs";

/**
 * Client side object that interacts with the server and keeps track of the
 * game state and metadata. Calling classes can use this objects properties
 * directly, as long as they are not modified.
 */
class GameModel {
  /**
   * Constructs a new GameModel object that interacts with the server through
   * MetaAuthClient object [socket].
   */
  constructor(user, socket) {
    this.user = user;
    this.socket = socket;
    this.gamedata = undefined;
    this.chat = [];
    this.metadata = {}; //this.metadata has the same type as the return from
                        //this.socket.notify("getMetaData")
    this.gameResult = undefined;
    this.cause = undefined;
    this.listeners = [];
    this.userElo = "????";
    this.opponentElo = "????";
    this.userRematch = false;
    this.opponentRematch = false;
    this.initializeSocket();
    this.refreshGameData();
    this.refreshMetaData();
    this.refreshChat();
  }
  /**
   * Some getter functions
   */
  getGameData() {
    return this.gamedata;
  }
  getChat() {
    return this.chat;
  }
  getMetaData() {
    return this.metadata;
  }
  /**
   * [listener] objects should contain the functions:
   *   [metaUpdated] (() => (None)): a function to call when the metadata is 
   *     updated
   *   [boardUpdated] (() => (None)): a function to call when the board state is
   *     updated
   *   [chatUpdated] (() => (None)): a function to call when the chat is updated
   *   [gameOver] (() => (None)): a function to call when the game ends
   *   [gameStarted] (() => (None)): a function to call when the game starts
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  initializeSocket() {
    this.socket.addEventHandler("boardUpdate", (meta, args) => {
      if(this.gamedata.history.length === args.i) {
        for(let move of args.moves) this.gamedata.move(move);
      } else {
        this.refreshGameData();
      }
      for(let listener of this.listeners) listener.boardUpdated();
    });
    this.socket.addEventHandler("chatUpdate", (meta, args) => {
      if(args.i === this.chat.length) {
        for(let message of args.messages) this.chat.push(message);
      } else {
        this.refreshChat();
      }
      for(let listener of this.listeners) listener.chatUpdated();
    });
    this.socket.addEventHandler("metaUpdate", (meta, args) => {
      this.metadata = args.data;
      for(let listener of this.listeners) listener.metaUpdated();
    });
    this.socket.addEventHandler("gameOver", (meta, args) => {
      this.gameResult = args.data.gameOverResult;
      this.cause = args.data.gameOverCause;
      for(let listener of this.listeners) listener.gameOver();
      this.refreshMetaData();
      setInterval(() => {this.refreshLobby()}, 1000);
    });
    this.socket.addEventHandler("gameStarted", (meta, args) => {
      this.gamedata = new GameData(args.now);
      for(let listener of this.listeners) listener.gameStarted();
    });
  }
  refreshGameData() {
    let startIndex = this.gamedata === undefined ? 
      0 : this.gamedata.history.length - 1;
    this.socket.notify("getGameData", {user: this.user, i: startIndex}, 
      (meta, args) => {
        if(args.startTime === undefined) {
          this.gamedata = undefined;
          return;
        }
        if(!this.gamedata) this.gamedata = new GameData(args.startTime);
        for(let move of args.moves) this.gamedata.move(move);
        for(let listener of this.listeners) listener.boardUpdated();
      }
    );
  }
  refreshMetaData() {
    this.socket.notify("getMetaData", this.user, (meta, args) => {
      this.metadata = args;
      let opponent = args.white === this.user ? args.black : args.white;
      this.socket.notify("getUserInfo", {user: this.user}, (meta, args) => {
        this.userElo = args.elo;
        this.socket.notify("getUserInfo", {user: opponent}, (meta, args) => {
          this.opponentElo = args.elo;
          for(let listener of this.listeners) listener.metaUpdated();
        });
      });
    });
  }
  refreshChat() {
    let i = this.chat.length;
    this.socket.notify("getChat", {i: i, user: this.user},
      (meta, args) => {
        for(let message of args) {
          this.chat.push(message);
        }
        for(let listener of this.listeners) listener.chatUpdated();
      }
    );
  }
  refreshLobby() {
    let opponent = this.metadata.white === this.user ? this.metadata.black
      : this.metadata.white;
    this.socket.notify("lobbyData", {}, (meta, args) => {
      let opponentRematch = args.incoming.includes(opponent);
      let userRematch = args.outgoing.includes(opponent);
      let notifyListeners = this.opponentRematch !== opponentRematch
        || this.userRematch !== userRematch;
      this.opponentRematch = opponentRematch;
      this.userRematch = userRematch;
      if(notifyListeners) {
        for(let listener of this.listeners) {
          listener.metaUpdated();
        }
      }
    });
  }
  /** 
   * Attempts to make a move.
   */
  sendMove(iRow, iCol, fRow, fCol) {
    this.socket.notify("move", {iRow: iRow, iCol: iCol, fRow: fRow, fCol: fCol},
      (meta, args) => {});
  }
  /**
   * Attempts to send a chat message
   */
  sendMessage(msg) {
    this.socket.notify("message", msg, (meta, args) => {});
  }
  /**
   * Attempts to abort the game
   */
  abort() {
    this.socket.notify("abort", {}, () => {});
  }
  /** 
   * Attempts to resign the game
   */
  resign() {
    this.socket.notify("resign", {}, () => {});
  }
  offerDraw() {
    this.socket.notify("offerDraw", {}, () => {});
  }
  offerRematch() {
    let opponent = this.metadata.white === this.user ?
      this.metadata.black : this.metadata.white;
    this.socket.notify("createPrivateChallenge", opponent, () => {});
  }
  cancelRematch() {
    this.socket.notify("cancelChallenge", {}, () => {});
  }
  declareReady() {
    this.socket.notify("declareReady", {}, () => {});
  }
}

export {GameModel}
