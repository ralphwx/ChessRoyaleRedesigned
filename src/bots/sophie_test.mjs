
import {connect} from "../frontend/metaauthclient.mjs";
import {decodeGameData} from "../data/gamedataencoder.mjs";
import {LoginType, Color, ELIXIR} from "../data/enums.mjs";
import {listAttackable, computeFeatures} from "./chess_extension_sophie.mjs";
import {printBoard} from "../tests/test_framework.mjs";
import {BotSophie} from "./bot_sophie.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {GameData} from "../data/gamedata.mjs";

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

async function extractGameState(id, n) {
  let gamedata = await extractGameplay(id);
  let output = gamedata.history;
  while(!output.isNil() && n > 0) {
    output = output.tail;
    n--;
  }
  return output.head;
}

function printGameData(gamedata) {
  let output = [];
  let pointer = gamedata.history.head.moveHistory;
  console.log(gamedata.history.head.currentTime);
  while(!pointer.isNil()) {
    output.push(JSON.stringify(pointer.head));
    pointer = pointer.tail;
  }
  console.log(output.join("\n"));
}

let main = async () => {
  let bot = new BotSophie();
  let id = "ILIK0c1";
  //let gamedata = await extractGameplay(id);
  //printGameData(gamedata);
  let gamestate = await extractGameState(id, 37);
  let board = gamestate.boardHistory.head;

//  let board = ChessBoard.startingPosition();
//  board.move(6, 4, 4, 4);
//  board.move(1, 4, 3, 4);
//  let gamedata = new GameData(-1);
//  gamedata.move({iRow: 1, iCol: 4, fRow: 3, fCol: 4, color: Color.WHITE, time: ELIXIR});
//  gamedata.move({iRow: 6, iCol: 4, fRow: 4, fCol: 4, color: Color.BLACK, time: ELIXIR});
//  let board = gamedata.getBoard();
  printBoard(board);
  console.log(computeFeatures(2, 3, 1, 3, board));
  console.log(bot.moveValue(2, 3, 1, 3, board));
  console.log(computeFeatures(2, 3, 6, 3, board));
  console.log(bot.moveValue(2, 3, 6, 3, board));
//  console.log(bot.elixirValue(gamedata.history.head, Color.BLACK, 3 * ELIXIR));
  //console.log(bot.canAfford(gamestate, 2, 1, 6, 1, 40215));
  //console.log(bot.moveValue(2, 1, 6, 1, board));
  //console.log(computeFeatures(2, 1, 6, 1, board));
  //console.log(computeFeatures(3, 2, 6, 5, board));
  //console.log(bot.moveValue(3, 2, 6, 5, board));
  //console.log(computeFeatures(4, 7, 1, 4, board));
  //console.log(bot.moveValue(4, 7, 1, 4, board));
//  for(let [iRow, iCol, fRow, fCol] of board.listLegalMoves(Color.WHITE)) {
//    console.log("" + iRow + iCol + fRow + fCol);
//    console.log(bot.moveValue(iRow, iCol, fRow, fCol, board));
//  }
}

main();
