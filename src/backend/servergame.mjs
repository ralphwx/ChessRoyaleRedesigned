
import {ChessBoard} from "../chess.mjs";
import {Piece, Color, colorOf, MoveType} from "../enums.mjs";
import {ChatLog} from "../data/chat_log.mjs";

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
    this.wrematch = false;
    this.brematch = false;

    //this.gameOver is a bool representing whether the game ended.
    //this.gameOverCause is a string describing what caused the game to end.
    //this.gameResult is an object of type [Color] describing the winner of the
    //  game, or Color.NONE if drawn.
    this.gameOver = false;
    this.gameOverCause = undefined;
    this.gameResult = undefined;
    //this.gameState tracks the state of the board, motion sickness, and elixir
    this.gameState = undefined;
    this.chat = new ChatLog();
  }

  /**
   * Records a "declare ready" from [user].
   */
  setReady(user) {
    if(this.white === user) this.wready = true;
    else if(this.black === user) this.bready = true;
    else return;
    this.chat.addMessage(system, user + " declared ready");
    if(this.bothReady()) {
      let now = Date.now();
      this.gameState = new GameData(now);
    }
  }

  bothReady() {
    return this.bready && this.wready;
  }

  drawOffer(user) {
    if(this.white === user) this.wdraw = true;
    else if(this.black === user) this.bdraw = true;
    if(this.wdraw && this.bdraw) {
      this.gameOver = true;
      this.gameOverCause = "Drawn by agreement";
      this.gameResult = Color.NONE;
    }
  }

  rematchOffer(user) {
    if(this.white === user) this.wrematch = true;
    else if(this.black === user) this.brematch = true;
  }

  /**
   * Attempts to make a move, starting at [iRow, iCol] and ending at
   * [fRow, fCol]. [color] is the color of the player attempting this move,
   * and [time] is the local time when the move was received.
   * 
   * If the move updated the board state, then true is returned, otherwise
   * false is returned.
   */
  move(iRow, iCol, fRow, fCol, color, time) {
    let m = new Move(color, time, iRow, iCol, fRow, fCol);
    if(this.gameOver) return false;
    if(!this.bothReady()) return false;
    if(!this.gameState.isLegalMove(m)) return false;
    this.gameState.move(m);
    return true;
  }

  /**
   * Records a resignation request from user [user].
   */
  resign(user) {
    if(!this.gamestate.ongoing) return;
    if(this.white === user) {
      this.gamestate = {
        ongoing: false,
        cause: "resignation",
        winner: Color.BLACK,
      }
    } else if(this.black === user) {
      this.gamestate = {
        ongoing: false,
        cause: "resignation",
        winner: Color.WHITE,
      }
    } else throw "Who's " + user + "??";
  }

  /**
   * Records an abort request.
   */
  abort() {
    this.gamestate = {
      ongoing: false,
      winner: Color.NONE,
      cause: "aborted",
    }
  }
}

export {ServerGame};
