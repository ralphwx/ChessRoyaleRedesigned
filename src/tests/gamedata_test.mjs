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
  return true;
}

test("normal gameplay", t1);
test("out of order gameplay", t2);
test("past invaludates future", t3);
test("invalid past move", t4);
printResults();
