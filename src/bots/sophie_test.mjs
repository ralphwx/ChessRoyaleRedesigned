
import {connect} from "../frontend/metaauthclient.mjs";
import {decodeGameData} from "../data/gamedataencoder.mjs";
import {LoginType, Color, ELIXIR} from "../data/enums.mjs";
import {computeCapturable, listAttackable, computeFeatures} 
  from "./chess_extension_sophie.mjs";
import {printBoard} from "../tests/test_framework.mjs";
//import {BotSophie} from "./bot_sophie.mjs";
import {ChessBoard} from "../data/chess.mjs";
import {GameData} from "../data/gamedata.mjs";
import {selectMove} from "./bot_sophie2.mjs";

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

async function extractGameDataAfterMove(id, iRow, iCol, fRow, fCol) {
  let gamedata = await extractGameplay(id);
  let output = gamedata.history;
  while(!output.head.moveHistory.isNil()) {
    let {iRow: ir, iCol: ic, fRow: fr, fCol: fc} = output.head.moveHistory.head;
    if(iRow === ir && iCol === ic && fRow === fr && fCol === fc) {
      gamedata.history = output;
      return gamedata;
    }
    output = output.tail;
  }
  throw new Error("Could not find move: " + iRow + iCol + fRow + fCol);
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
  let id = "Wd5a4b6";
  let gamedataraw = await extractGameplay(id);
  printGameData(gamedataraw);
  let gamedata = await extractGameDataAfterMove(id, 0, 6, 2, 7);
  let board = gamedata.getBoard();

  printBoard(board);
  let time = gamedata.history.head.currentTime + 2200;
  console.log(selectMove(gamedata, Color.WHITE, time));
}

main();
