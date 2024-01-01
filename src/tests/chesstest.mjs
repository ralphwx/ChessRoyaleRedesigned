import {ChessBoard} from "../data/chess.mjs";
import {Piece, Color, colorOf, MoveType} from "../data/enums.mjs";
import {test, checkEq, checkEqStr, printBoard, printResults} from "./test_framework.mjs";

let t1 = () => {
  let output = true;
  let board = ChessBoard.startingPosition();
  return checkEqStr(board, "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr");
}

//toString might not need to be implemented, so skip this test
let t2 = () => {
//  let board = ChessBoard.startingPosition();
//  let board2 = ChessBoard.fromString(board.toString());
//  return checkEq(board, board2);
    return true;
}

let t3 = () => {
  let output = true;
  let board = ChessBoard.startingPosition();
  //illegal rook moves
  board = board.move(0, 0, 0, 1);
  board = board.move(0, 0, 1, 0);
  board = board.move(0, 0, 2, 0);
  board = board.move(7, 7, 7, 6);
  board = board.move(7, 7, 7, 5);
  //illegal knight moves
  board = board.move(0, 1, 1, 0);
  board = board.move(0, 6, 2, 2);
  board = board.move(7, 1, 5, 1);
  //illegal pawn moves
  board = board.move(1, 3, 2, 4);
  board = board.move(1, 3, 2, 1);
  //illegal queen moves
  board = board.move(0, 3, 0, 4);
  board = board.move(0, 3, 4, 3);
  //illegal king moves
  board = board.move(0, 4, 0, 5);
  board = board.move(0, 4, 1, 4);
  board = board.move(0, 4, 0, 6);
  board = board.move(7, 4, 7, 5);
  board = board.move(7, 4, 6, 4);
  board = board.move(0, 4, 0, 2);
  board = board.move(7, 4, 7, 6);
  board = board.move(7, 4, 7, 2);
  //illegal bishop moves
  board = board.move(0, 2, 1, 3);
  board = board.move(0, 2, 2, 4);
  board = board.move(7, 5, 6, 6);
  board = board.move(7, 5, 5, 7);
  return checkEq(board, ChessBoard.startingPosition());
}

let t4 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(6, 4, 4, 4);
  board = board.move(0, 3, 4, 7);
  board = board.move(7, 1, 5, 2);
  board = board.move(0, 5, 3, 2);
  board = board.move(7, 6, 5, 5);
  board = board.move(4, 7, 6, 5);
  let s = "RNB K NRPPPP PPP          B P       p     n  n  pppp Qppr bqkb r";
  return checkEqStr(board, s);
}

let t5 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(6, 4, 4, 4);
  board = board.move(0, 6, 2, 7);
  board = board.move(0, 5, 1, 4);
  board = board.move(0, 4, 0, 6);
  board = board.move(6, 3, 5, 3);
  board = board.move(7, 2, 5, 4);
  board = board.move(7, 1, 6, 3);
  board = board.move(7, 3, 4, 6);
  board = board.move(7, 4, 7, 1);
  let s = "RNBQ RK PPPPBPPP       N    P       p q    pb   pppn ppp  kr bnr";
  return checkEqStr(board, s);
}

let t6 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(0, 5, 3, 2);
  board = board.move(0, 6, 2, 5);
  board = board.move(0, 4, 0, 6);
  board = board.move(0, 6, 0, 7);
  let s = "RNBQ R KPPPP PPP     N    B P                   pppppppprnbqkbnr";
  return checkEqStr(board, s);
}

//en passant tests. En passant rule: if the pawn moves two spaces and the 
//opponent's pawn is already there, the opponent has not made any moves since
//the pawn was pushed two squares, and there is no piece immediately behind
//that pawn, then en passant is possible

let t7 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(3, 4, 4, 4);
  board = board.move(6, 3, 4, 3);
  board = board.move(4, 4, 5, 3);
  let s = "RNBQKBNRPPPP PPP                           P    ppp pppprnbqkbnr";
  return checkEqStr(board, s);
}

let t8 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(6, 3, 4, 3);
  board = board.move(3, 4, 4, 4);
  board = board.move(4, 4, 3, 5);
  let s = "RNBQKBNRPPPP PPP                   pP           ppp pppprnbqkbnr";
  return checkEqStr(board, s);
}

let t9 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 0, 3, 0);
  board = board.move(3, 0, 4, 0);
  board = board.move(6, 1, 4, 1);
  board = board.move(1, 7, 3, 7);
  board = board.move(4, 0, 5, 1);
  let s = "RNBQKBNR PPPPPP                PPp              p pppppprnbqkbnr";
  return checkEqStr(board, s);
}

let t10 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 2, 3, 2);
  board = board.move(3, 2, 4, 2);
  board = board.move(6, 3, 4, 3);
  board = board.move(7, 3, 5, 3);
  board = board.move(4, 2, 5, 3);
  let s = "RNBQKBNRPP PPPPP                   p       P    ppp pppprnb kbnr";
  return checkEqStr(board, s);
}

let t11 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(6, 6, 4, 6);
  board = board.move(4, 6, 3, 6);
  board = board.move(1, 5, 2, 5);
  board = board.move(2, 5, 3, 5);
  board = board.move(3, 6, 2, 5);
  let s = "RNBQKBNRPPPPP PP             Pp                 pppppp prnbqkbnr";
  return checkEqStr(board, s);
}

let t12 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(6, 4, 4, 4);
  board = board.move(0, 6, 2, 5);
  board = board.move(1, 5, 3, 5);
  board = board.move(0, 4, 0, 6);
  board = board.move(6, 3, 5, 3);
  board = board.move(1, 3, 3, 3);
  board = board.move(7, 2, 3, 6);
  board = board.move(3, 3, 4, 4);
  board = board.move(3, 6, 0, 3);
  board = board.move(3, 6, 2, 5);
  board = board.move(0, 3, 2, 5);
  board = board.move(5, 3, 4, 4);
  board = board.move(0, 5, 3, 2);
  board = board.move(7, 6, 5, 5);
  board = board.move(2, 5, 2, 1);
  board = board.move(7, 3, 6, 4);
  board = board.move(0, 1, 2, 2);
  board = board.move(6, 2, 5, 2);
  board = board.move(0, 2, 4, 6);
  board = board.move(6, 1, 4, 1);
  board = board.move(2, 2, 4, 1);
  board = board.move(5, 2, 4, 1);
  board = board.move(3, 2, 4, 1);
  board = board.move(7, 1, 6, 3);
  board = board.move(0, 4, 0, 2);
  board = board.move(7, 0, 7, 3);
  board = board.move(0, 3, 6, 3);
  board = board.move(7, 3, 6, 3);
  board = board.move(0, 7, 0, 3);
  board = board.move(6, 4, 5, 4);
  board = board.move(4, 1, 6, 3);
  board = board.move(5, 5, 6, 3);
  board = board.move(2, 1, 7, 1);
  board = board.move(6, 3, 7, 1);
  board = board.move(0, 3, 7, 3);
  let s = "  K     PPP  PPP            P       p B     q   p    ppp n Rkb r";
  return checkEqStr(board, s);
}

let t13 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 4, 3, 4);
  board = board.move(6, 4, 4, 4);
  board = board.move(3, 4, 4, 4);
  board = board.move(4, 4, 3, 4);
  let s = "RNBQKBNRPPPP PPP            P       p           pppp ppprnbqkbnr";
  return checkEqStr(board, s);
}

let t14 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(6, 2, 4, 2);
  board = board.move(4, 2, 3, 2);
  board = board.move(1, 1, 3, 1);
  board = board.move(3, 2, 2, 1);
  let s = "RNBQKBNRP PPPPPP p                              pp ppppprnbqkbnr";
  return checkEqStr(board, s);
}

let t15 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(1, 2, 3, 2);
  board = board.move(3, 2, 4, 2);
  board = board.move(6, 1, 4, 1);
  board = board.move(4, 1, 3, 1);
  board = board.move(4, 2, 5, 1);
  board = board.move(6, 4, 4, 4);
  board = board.move(4, 4, 3, 4);
  board = board.move(1, 3, 3, 3);
  board = board.move(3, 3, 4, 3);
  board = board.move(3, 4, 2, 3);
  let s = "RNBQKBNRPP  PPPP         p  p     PP            p pp ppprnbqkbnr";
  return checkEqStr(board, s);
}

let t16 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(6, 4, 4, 4);
  board = board.move(4, 4, 3, 4);
  board = board.move(1, 3, 3, 3);
  board = board.move(3, 4, 2, 3);
  let s = "RNBQKBNRPPP PPPP   p                            pppp ppprnbqkbnr";
  return checkEqStr(board, s);
}

let t17 = () => {
  let board = ChessBoard.startingPosition();
  board = board.move(6, 4, 4, 4);
  board = board.move(7, 6, 5, 5);
  board = board.move(7, 5, 6, 4);
  board = board.move(7, 4, 7, 6);
  let s = "RNBQKBNRPPPPPPPP                    p        n  ppppbppprnbq rk ";
  return checkEqStr(board, s);
}

test("starting position", t1);
test("to/from String1", t2);
test("illegal moves 1", t3);
test("scholar's mate", t4);
test("castling 1", t5);
test("king h1", t6);
test("en passant 1", t7);
test("illegal en passant", t8);
test("illegal en passant 2", t9);
test("illegal en passant 3", t10);
test("illegal en passant 4", t11);
test("opera game", t12);
test("illegal pawn capture", t13);
test("en passant 2", t14);
test("illegal en passant 5", t15);
test("en passant 3", t16);
test("black kingside castle", t17);
printResults();
