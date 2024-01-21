
import {Color, GameOverCause} from "../data/enums.mjs";
import {ChatLog} from "../data/chat_log.mjs";
import {Move, GameData} from "../data/gamedata.mjs";

/**
 * A string constant representing the origin of server-generated messages.
 */
const system = "[system]";

/**
 * ServerGame tracks the data relevant to a single game of ChessRoyale,
 * including the player's usernames, the color they're playing, the state of
 * the board, whether or not they're ready, and whether or not the game is over.
 */
class ServerGame {
  /**
   * Initializes a new ServerGame with [whiteUser] playing white and 
   * [blackUser] playing black.
   */
  constructor(whiteUser, blackUser) {
    this.white = whiteUser;
    this.black = blackUser;
    this.wready = false;
    this.bready = false;
    this.wdraw = false;
    this.bdraw = false;

    //this.listeners is the set of listener objects attached to this ServerGame
    //object.
    this.listeners = [];

    //this.gameOver is a bool representing whether the game ended.
    //this.gameOverCause is an object of type [GameOverCause], describing how
    // the game ended.
    //this.gameResult is an object of type [Color] describing the winner of the
    //  game, or Color.NONE if drawn.
    this.gameOver = false;
    this.gameOverCause = undefined;
    this.gameResult = undefined;
    //this.gameState tracks the state of the board, motion sickness, and elixir
    this.gameState = undefined;
    this.chat = new ChatLog();
    this.chat.addListener((i, l) => {
      for(let listener of this.listeners) {
        listener.chatUpdate(i, l);
      }
    });
  }

  /**
   * Adds a listener object to this ServerGame. [listener] is required to be an
   * object with functions:
   *   - boardUpdate(int, list)
   *   - chatUpdate(int, list)
   *   - metaUpdate(data)
   *   - gameOver(data)
   *   - gameStarted(now)
   * [boardUpdate] is a function with the same specifications as the argument to
   * GameData.addListener. [chatUpdate] is a function with the same 
   * specifications as the argument to ChatLog.addListener. 
   *
   * [metaUpdate] is a function that takes an object with properties [white],
   * [black], [wready], [bready], [wdraw], and [bdraw]. [white] and [black] are
   * the usernames of the players; [wready] and [bready] signify whether they 
   * have declared ready, and [wdraw] and [bdraw] signify whether they have
   * offered a draw.
   *
   * [gameOver] is a function that takes an object with properties 
   * [gameOverCause] and [gameOverResult]. This function is called when the
   * game ends.
   * 
   * [gameStarted] is a function that takes [now] as an input, where [now]
   * is the local time when the game started. This function is called
   * immediately after both players declare ready.
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  /**
   * Helper function for telling all the listeners the metadata was updated
   */
  notifyMetaUpdate() {
    for(let l of this.listeners) {
      l.metaUpdate({
        white: this.white,
        black: this.black,
        wdraw: this.wdraw,
        bdraw: this.bdraw,
        wready: this.wready,
        bready: this.bready,
      });
    }
  }
  /**
   * Helper function for telling all the listeners the game ended
   */
  notifyGameOver() {
    for(let l of this.listeners) {
      l.gameOver({
        gameOverCause: this.gameOverCause,
        gameOverResult: this.gameResult,
      });
    }
  }
  /**
   * Records a "declare ready" from [user].
   */
  setReady(user) {
    if(this.white === user && !this.wready) this.wready = true;
    else if(this.black === user && !this.bready) this.bready = true;
    else return;
    this.chat.addMessage(system, user + " declared ready");
    this.notifyMetaUpdate();
    if(this.bothReady()) {
      let now = Date.now();
      this.gameState = new GameData(now);
      this.gameState.addListener((i, l) => {
        for(let listener of this.listeners) {
          listener.boardUpdate(i, l);
        }
      });
      this.chat.addMessage(system, "game started");
      for(let l of this.listeners) {
        l.gameStarted(now);
      }
    }
  }

  /**
   * Helper function for checking whether both players are ready
   */
  bothReady() {
    return this.bready && this.wready;
  }

  /**
   * Records a draw offer from [user].
   */
  drawOffer(user) {
    if(this.white === user && !this.wdraw) this.wdraw = true;
    else if(this.black === user && !this.bdraw) this.bdraw = true;
    else return;
    this.notifyMetaUpdate();
    if(this.wdraw && this.bdraw) {
      this.chat.addMessage(system, user + " accepted the draw");
      this.gameOver = true;
      this.gameOverCause = GameOverCause.AGREE;
      this.gameResult = Color.NONE;
      this.notifyGameOver();
    } else {
      this.chat.addMessage(system, user + " offered a draw");
    }
  }

  /**
   * Attempts to make a move, starting at [iRow, iCol] and ending at
   * [fRow, fCol]. [color] is the color of the player attempting this move,
   * and [time] is the local time when the move was received. Does nothing if
   * the move is illegal for any reason.
   */
  move(iRow, iCol, fRow, fCol, color, time) {
    let m = new Move(color, time, iRow, iCol, fRow, fCol);
    if(this.gameOver) return;
    if(!this.bothReady()) return;
    if(!this.gameState.isLegalMove(m)) return;
    this.gameState.move(m);
    if(this.gameState.history.head.gameOver !== Color.NONE) {
      this.gameOver = true;
      this.gameResult = this.gameState.history.head.gameOver;
      this.gameOverCause = GameOverCause.KING;
      this.notifyGameOver();
    }
  }

  /**
   * Records a resignation request from user [user].
   */
  resign(user) {
    if(this.gameOver) return;
    if(!this.bothReady()) return;
    if(this.white === user) {
      this.gameOver = true;
      this.gameOverCause = GameOverCause.RESIGN;
      this.gameResult = Color.BLACK;
      this.chat.addMessage(system, user + "resigned");
    } else if(this.black === user) {
      this.gameOver = true;
      this.gameOverCause = GameOverCause.RESIGN;
      this.gameResult = Color.WHITE;
      this.chat.addMessage(system, user + "resigned");
    } else return;
    this.notifyGameOver();
  }

  /**
   * Records an abort request.
   */
  abort() {
    this.gameResult = Color.NONE;
    this.gameOver = true;
    this.gameOverCause = GameOverCause.ABORT;
    this.notifyGameOver();
  }

  /**
   * Records a message sent in the chat
   */
  chatMessage(user, message) {
    this.chat.addMessage(user, message);
  }
}

export {ServerGame};
