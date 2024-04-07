
import {connect} from "../frontend/metaauthclient.mjs";
import {decodeGameData} from "../data/gamedataencoder.mjs";
import {LoginType, Color} from "../data/enums.mjs";
import {selectMove} from "./chess_extension_sophie.mjs";

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
  while(!pointer.isNil()) {
    output.push(JSON.stringify(pointer.head));
    pointer = pointer.tail;
  }
  console.log(output.join("\n"));
}

let main = async () => {
  let id = "dKQL3iL";
  let gamedata = await extractGameplay(id);
  let gamestate = await extractGameState(id, 5);
  console.log(selectMove(gamestate, 42951, Color.WHITE, 1));
}

main();
