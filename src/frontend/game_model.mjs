
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
    this.metadata = {};
    this.gameResult = undefined;
    this.cause = undefined;
    this.initializeSocket();
  }
  initializeSocket() {
    this.socket.addEventHandler("boardUpdate", (meta, args) => {
      if(this.gamedata.history.length === args.i) {
        for(let move of args.moves) this.gamedata.move(move);
      } else {
        this.refreshGameData();
      }
    });
    this.socket.addEventHandler("chatUpdate", (meta, args) => {
      if(args.i === chat.length) {
        for(let message of args.messages) chat.push(message);
      } else {
        refreshChat();
      }
    });
    this.socket.addEventHandler("metaUpdate", (meta, args) => {
      this.metadata = args;
    });
    this.socket.addEventHandler("gameOver", (meta, args) => {
      this.gameResult = args.data.gameOverResult;
      this.cause = args.data.gameOverCause;
    });
    this.socket.addEventHandler("gameStarted", (meta, args) => {
      this.gamedata = new GameData(args);
    });
  }
  refreshGameData() {
    let startIndex = this.gamedata === undefined ? 0 : gamedata.history.length - 1;
    this.socket.notify("getGameData", {user: this.user, i: startIndex}, 
      (meta, args) => {
        if(args.startTime === undefined) {
          this.gamedata = undefined;
          return;
        }
        if(!this.gamedata) this.gamedata = new GameData(args.startTime);
        for(let move of args.moves) gamedata.move(move);
      }
    );
  }
  refreshMetaData() {
    this.socket.notify("getMetaData", this.user, (meta, args) => {
      this.metadata = args;
    });
  }
  refreshChat() {
    this.socket.notify("getChat", {i: this.chat.length, user: this.user},
      (meta, args) => {
        for(let message of args) {
          chat.push(message);
        }
      }
    );
  }
}
