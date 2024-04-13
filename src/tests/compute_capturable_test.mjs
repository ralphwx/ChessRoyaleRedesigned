import {connect} from "../frontend/metaauthclient.mjs";
import {decodeGameData} from "../data/gamedataencoder.mjs";
import {LoginType, Color} from "../data/enums.mjs";
import {computeCapturable} from "../bots/compute_capturable.mjs";
import {test, printResults} from "./test_framework.mjs";
import {ChessBoard} from "../data/chess.mjs";

async function extractGameState(id, n) {
  let gamedata = await extractGameplay(id);
  let output = gamedata.history;
  while(!output.isNil() && n > 0) {
    output = output.tail;
    n--;
  }
  return output.head;
}

function extractGameplay(id) {
  return new Promise((resolve, reject) => {
    connect("https://royalechess.org", "ralphwx", "asdfghjkl;", LoginType.LOGIN,
     undefined, (socket) => {
      socket.notify("loadGame", id, (meta, args) => {
        resolve(decodeGameData(args.gamedata));
      });
    }, (msg) => {
      console.log(msg);
      reject(msg);
    });
  });
}

let main = async () => {
  let gamestate = await extractGameState("o0TKYJO", 11);
  let t1 = () => {
    let board = gamestate.boardHistory.head;
    let cc1 = computeCapturable(board, Color.WHITE);
    let cc2 = computeCapturable(board.move(7, 1, 5, 0), Color.WHITE);
    return cc1 === 1 && cc2 === 1;
  }
  test("t1", t1);
  let t2 = () => {
    let board = ChessBoard.startingPosition();
    board = board.move(1, 4, 3, 4);
    board = board.move(6, 4, 4, 4);
    board = board.move(0, 3, 4, 7);
    board = board.move(7, 1, 5, 2);
    board = board.move(0, 5, 3, 2);
    return computeCapturable(board, Color.WHITE) === 1;
  }
  test("t2", t2);
  gamestate = await extractGameState("o2GF2tD", 7);
  let t3 = () => {
    let board = gamestate.boardHistory.head;
    let cc1 = computeCapturable(board, Color.BLACK);
    let cc2 = computeCapturable(board.move(2, 7, 6, 7), Color.BLACK);
    return cc1 === 0 && cc2 === 9;
  }
  test("t3", t3);
  gamestate = await extractGameState("THyQfp7", 2);
  let t4 = () => {
    let board = gamestate.boardHistory.head;
    let cc1 = computeCapturable(board, Color.WHITE);
    return cc1 === 0;
  }
  test("t4", t4);
  printResults();
}

main();
