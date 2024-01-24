
/**
 * Enum representing the types of chess pieces. NULL refers to the absence of
 * a chess piece.
 */
const Piece = {
  W_PAWN: 1,
  W_ROOK: 2,
  W_KNIGHT: 3,
  W_BISHOP: 4,
  W_QUEEN: 5,
  W_KING: 6,
  B_PAWN: 7,
  B_ROOK: 8,
  B_KNIGHT: 9,
  B_BISHOP: 10,
  B_QUEEN: 11,
  B_KING: 12,
  NULL: 13,
}

/**
 * Converts a piece [p] to its string representation.
 */
function pieceToString(p) {
  switch(p) {
    case Piece.W_PAWN: return "P";
    case Piece.W_ROOK: return "R";
    case Piece.W_KNIGHT: return "N";
    case Piece.W_BISHOP: return "B";
    case Piece.W_QUEEN: return "Q";
    case Piece.W_KING: return "K";
    case Piece.B_PAWN: return "p";
    case Piece.B_ROOK: return "r";
    case Piece.B_KNIGHT: return "n";
    case Piece.B_BISHOP: return "b";
    case Piece.B_QUEEN: return "q";
    case Piece.B_KING: return "k";
    case Piece.NULL: return " ";
    default: throw new Error("Incomplete case match: " + p);
  }
}

/**
 * Enum containing players' colors. NONE represents a "neutral" color.
 */
const Color = {
  BLACK: 1,
  WHITE: 2,
  NONE: 3,
}

/**
 * Returns the color of a chess piece. If the piece is NULL, then the color
 * is NONE.
 */
function colorOf(piece) {
  if(piece === Piece.NULL) return Color.NONE;
  if(piece >= Piece.B_PAWN) return Color.BLACK;
  return Color.WHITE;
}

/**
 * Enum containing different types of moves.
 */
const MoveType = {
  MOVE: 1,
  ENPESANT: 2,
  CASTLE: 3,
  PROMOTION: 4,
  INVALID: 5,
  PAWN_THRUST: 6,
}

/**
 * URL is the url of the server where the game is running.
 */
//var URL = "https://royalechess.org";
const URL = "http://localhost:8080";

/**
 * Some gameplay constants
 */
const DELAY = 2000;
const ELIXIR = 4000;
const BAR_MAX = 10;

/**
 * Enum representing types of logins
 */
const LoginType = {
  CREATE: 0,
  LOGIN: 1,
  GUEST: 2,
}

/**
 * Enum representing different ways a game can end
 */
const GameOverCause = {
  RESIGN: 0, //resignation
  AGREE: 1,  //agree to draw
  ABORT: 2,  //game aborted
  KING: 3,   //king captured
}

/**
 * Enum representing places a user could be
 */
const Location = {
  LOBBY: 0,
  GAME: 1,
}

export {Piece, pieceToString, Color, colorOf, MoveType, URL, DELAY, ELIXIR, BAR_MAX, LoginType, GameOverCause, Location};
