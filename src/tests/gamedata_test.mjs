import {Move, GameData} from "../data/gamedata.mjs";
import {Color, ELIXIR, DELAY} from "../data/enums.mjs";
import {test, checkEq, checkEqStr, printBoard, printResults} from "./test_framework.mjs";

let t1 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR, 7, 1, 5, 2));
  state.move(new Move(Color.WHITE, ELIXIR * 2, 0, 5, 3, 2));
  state.move(new Move(Color.BLACK, ELIXIR * 2, 5, 2, 3, 1));
  state.move(new Move(Color.WHITE, ELIXIR * 3, 0, 3, 4, 7));
  state.move(new Move(Color.BLACK, ELIXIR * 3, 3, 1, 2, 3));
  state.move(new Move(Color.WHITE, ELIXIR * 4, 4, 7, 6, 5));
  state.move(new Move(Color.BLACK, ELIXIR * 4, 2, 3, 0, 4));
  return checkEqStr(state.getBoard(), "RNB n NRPPPP PPP          B P                   pppppQppr bqkbnr");
};

let t2 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.WHITE, ELIXIR * 2, 0, 5, 3, 2));
  state.move(new Move(Color.WHITE, ELIXIR * 3, 0, 3, 4, 7));
  state.move(new Move(Color.WHITE, ELIXIR * 4, 4, 7, 6, 5));
  state.move(new Move(Color.BLACK, ELIXIR, 7, 1, 5, 2));
  state.move(new Move(Color.BLACK, ELIXIR * 2, 5, 2, 3, 1));
  state.move(new Move(Color.BLACK, ELIXIR * 3, 3, 1, 2, 3));
  state.move(new Move(Color.BLACK, ELIXIR * 4, 2, 3, 0, 4));
  return checkEqStr(state.getBoard(), "RNB n NRPPPP PPP          B P                   pppppQppr bqkbnr");
};

let t3 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR, 7, 1, 5, 2));
  state.move(new Move(Color.WHITE, ELIXIR * 2, 0, 3, 4, 7));
  state.move(new Move(Color.BLACK, ELIXIR * 2, 5, 2, 3, 1));
  state.move(new Move(Color.WHITE, ELIXIR * 3, 4, 7, 6, 5));
  state.move(new Move(Color.WHITE, ELIXIR * 4, 0, 5, 3, 2));
  state.move(new Move(Color.WHITE, ELIXIR * 5, 6, 5, 7, 6));
  state.move(new Move(Color.BLACK, ELIXIR * 6, 7, 7, 7, 6));
  state.move(new Move(Color.WHITE, ELIXIR * 6, 3, 2, 7, 6));
  state.move(new Move(Color.BLACK, ELIXIR * 3, 3, 1, 2, 3));
  return checkEqStr(state.getBoard(), "RNB KBNRPPPP PPP   n        P                   ppppp ppr bqkbr ");
}

let t4 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR, 7, 1, 5, 2));
  state.move(new Move(Color.BLACK, 2 * ELIXIR, 5, 2, 3, 1));
  state.move(new Move(Color.BLACK, 3 * ELIXIR, 3, 1, 2, 3));
  state.move(new Move(Color.BLACK, 4 * ELIXIR, 2, 3, 0, 2));
  state.move(new Move(Color.WHITE, 3.5 * ELIXIR, 0, 5, 3, 2));
  return checkEqStr(state.getBoard(), "RNnQKBNRPPPP PPP            P                   ppppppppr bqkbnr");
}

let t5 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, 0.5 * ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR, 6, 4, 4, 4));
  state.move(new Move(Color.BLACK, ELIXIR * 1.5, 6, 3, 4, 3));
  return checkEqStr(state.getBoard(), "RNBQKBNRPPPPPPPP                    p           pppp ppprnbqkbnr");
};

let t6 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, 3 * ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.WHITE, 3 * ELIXIR + 0.2 * DELAY, 1, 3, 3, 3));
  state.move(new Move(Color.WHITE, 3 * ELIXIR + 0.4 * DELAY, 3, 4, 4, 4));
  return checkEqStr(state.getBoard(), "RNBQKBNRPPP  PPP           PP                   pppppppprnbqkbnr");
}

let t7 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.BLACK, 11 * ELIXIR, 6, 0, 5, 0));
  state.move(new Move(Color.BLACK, 11.125 * ELIXIR, 6, 1, 5, 1));
  state.move(new Move(Color.BLACK, 11.25 * ELIXIR, 6, 2, 5, 2));
  state.move(new Move(Color.BLACK, 11.375 * ELIXIR, 6, 3, 5, 3));
  state.move(new Move(Color.BLACK, 11.5 * ELIXIR, 6, 4, 5, 4));
  state.move(new Move(Color.BLACK, 11.625 * ELIXIR, 6, 5, 5, 5));
  state.move(new Move(Color.BLACK, 11.75 * ELIXIR, 6, 6, 5, 6));
  state.move(new Move(Color.BLACK, 11.875 * ELIXIR, 6, 7, 5, 7));
  state.move(new Move(Color.BLACK, 12 * ELIXIR, 5, 0, 4, 0));
  state.move(new Move(Color.BLACK, 12.125 * ELIXIR, 5, 1, 4, 1));
  state.move(new Move(Color.BLACK, 12.25 * ELIXIR, 5, 2, 4, 2));
  state.move(new Move(Color.BLACK, 12.375 * ELIXIR, 5, 3, 4, 3));
  state.move(new Move(Color.BLACK, 12.5 * ELIXIR, 5, 4, 4, 4));
  return checkEqStr(state.getBoard(), "RNBQKBNRPPPPPPPP                ppp        ppppp        rnbqkbnr");
}

let t8 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 2, 3));
  state.move(new Move(Color.WHITE, 1.1 * ELIXIR, 0, 1, 2, 1));
  state.move(new Move(Color.WHITE, 1.2 * ELIXIR, 0, 6, 2, 5));
  return checkEqStr(state.getBoard(), "RNBQKB RPPPPPPPP     N                          pppppppprnbqkbnr");
}

let t9 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, 1.5 * ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.WHITE, 1.2 * ELIXIR, 1, 3, 3, 3));
  return checkEqStr(state.getBoard(), "RNBQKBNRPPP PPPP           P                    pppppppprnbqkbnr");
}

let t10 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR * 1.2, 6, 4, 4, 4));
  state.move(new Move(Color.WHITE, ELIXIR * 2, 0, 1, 2, 2));
  state.move(new Move(Color.BLACK, ELIXIR * 2.2, 7, 1, 5, 2));
  let moves_since_1 = state.movesSince(1);
  if(moves_since_1[0].color !== Color.BLACK) return false;
  if(moves_since_1[0].iRow !== 6) return false;
  if(moves_since_1[1].color !== Color.WHITE) return false;
  if(moves_since_1[1].fRow !== 2) return false;
  if(moves_since_1.length !== 3) return false;
  return true;
}

let t11 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR * 1.2, 6, 4, 4, 4));
  state.move(new Move(Color.WHITE, ELIXIR * 2, 0, 1, 2, 2));
  state.move(new Move(Color.BLACK, ELIXIR * 2.2, 7, 1, 5, 2));
  let moves_since_10 = state.movesSince(10);
  return moves_since_10.length === 0;
}

let t12 = () => {
  let state = new GameData(-1);
  state.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  state.move(new Move(Color.BLACK, ELIXIR * 1.2, 6, 4, 4, 4));
  state.move(new Move(Color.WHITE, ELIXIR * 2, 0, 1, 2, 2));
  state.move(new Move(Color.BLACK, ELIXIR * 2.2, 7, 1, 5, 2));
  let moves_since_zero = state.movesSince(0);
  if(moves_since_zero.length !== 4) return false;
  if(moves_since_zero[0].color !== Color.WHITE) return false;
  if(moves_since_zero[0].iRow !== 1) return false;
  if(moves_since_zero[1].color !== Color.BLACK) return false;
  if(moves_since_zero[1].fRow !== 4) return false;
  if(moves_since_zero[2].iCol !== 1) return false;
  if(moves_since_zero[3].fCol !== 2) return false;
  return true;
}

let t13 = () => {
  let data1 = new GameData(-1);
  let data2 = new GameData(-1);
  data1.addListener((i, moves) => {
    data2.rewriteMoves(data2.history.length - i, moves);
  });
  data1.move(new Move(Color.WHITE, ELIXIR * 1.2, 1, 4, 3, 4));
  data1.move(new Move(Color.BLACK, ELIXIR, 6, 4, 4, 4));
  data1.move(new Move(Color.WHITE, ELIXIR * 2, 0, 6, 2, 5));
  data1.move(new Move(Color.BLACK, ELIXIR * 2.2, 7, 1, 5, 2));
  return checkEq(data1.getBoard(), data2.getBoard());
}

let t14 = () => {
  let data1 = new GameData(-1);
  let data2 = new GameData(-1);
  data1.move(new Move(Color.WHITE, ELIXIR, 1, 4, 3, 4));
  data1.move(new Move(Color.BLACK, ELIXIR * 1.2, 6, 4, 4, 4));
  data1.addListener((i, moves) => {
    let starti = data2.history.length - i;
    if(starti < 0) {
      starti = 0;
      moves = data1.movesSince(data2.history.length - 1);
    }
    data2.rewriteMoves(starti, moves);
  });
  data1.move(new Move(Color.WHITE, ELIXIR * 2, 0, 6, 2, 5));
  data1.move(new Move(Color.BLACK, ELIXIR * 2.2, 7, 1, 5, 2));
  return checkEq(data1.getBoard(), data2.getBoard());
}

test("normal gameplay", t1);
test("out of order gameplay", t2);
test("past invaludates future", t3);
test("invalid past move", t4);
test("negative elixir", t5);
test("motion sickness", t6);
test("excess elixir cap", t7);
test("invalid chess moves", t8);
test("past consumes future elixir", t9);
test("movesSince test, normal case", t10);
test("movesSince future = empty", t11);
test("movesSince zero = all", t12);
test("board synchronization 1", t13);
test("board synchronization 2", t14);
printResults();
