
/**
 * This file contains a list of positions and recommended moves corresponding
 * to each position. This is intended for testing different bots: the stronger
 * a bot is, the better its move recommendations should match those presented
 * in this file
 *
 * [data] is this module's export, which contains objects of the form 
 * {position, color, moves}. [position] is the ChessBoard object corresponding
 * to the position on the board, [color] is the color of the turn player,
 * and [moves] are the list of {iRow, iCol, fRow, fCol, value} objects where
 * the first four properties specify the move and [value] is the approximate 
 * value of the move, in terms of number of pawn equivalents.
 *
 */

import {ChessBoard} from "../data/chess.mjs";
import {Color} from "../data.enums.mjs";

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

async function getData() {
  let data = [];
  data.push({
    board: ChessBoard.startingPosition(),
    color: Color.WHITE,
    moves: [{iRow: 1, iCol: 4, fRow: 3, fCol: 4, value: 1.5},
    {iRow: 1, iCol: 3, fRow: 3, fCol: 3, value: 1.4},
    {iRow: 1, iCol: 2, fRow: 3, fCol: 2, value: 0.8},
    {iRow: 1, iCol: 4, fRow: 2, fCol: 4, value: 0.8},
    {iRow: 0, iCol: 6, fRow: 2, fCol: 5, value: 0.8},
  });
  //TODO
}


