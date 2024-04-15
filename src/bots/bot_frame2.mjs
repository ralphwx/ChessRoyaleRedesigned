
import {Color, Location, ELIXIR, DELAY} from "../data/enums.mjs";
import {GameModel} from "../frontend/game_model.mjs";
import {Move} from "../data/gamedata.mjs";
import {Mutex} from "async-mutex";
import {printBoard} from "../tests/test_framework.mjs";
import {Scheduler} from "./scheduler.mjs";

/**
 * Scales each element of [probs] so that the list adds to 1
 */
function normalize(probs) {
  let sum = 0;
  for(let p of probs) sum += p;
  for(let i = 0; i < probs.length; i++) probs[i] /= sum;
}

function getElixirCount(gamedata, now, color) {
  if(color === Color.WHITE) {
    return (now - gamedata.history.head.wStart) / ELIXIR;
  }
  if(color === Color.BLACK) {
    return (now - gamedata.history.head.bStart) / ELIXIR;
  }
  throw new Error("Invalid color: " + color);
}

function runBot(selectMove, interval, reactionTime, socket) {
  let game_model = new GameModel(socket.user, socket);
  socket.notify("redirect?", {}, (meta, args) => {
    if(args === Location.GAME) {
      socket.notify("declareReady", {}, (meta, args) => {});
    } else {
      socket.notify("createOpenChallenge", {}, () => {});
    }
  });
  socket.addEventHandler("joined", (meta, args) => {
    game_model.refreshGameData();
    socket.notify("declareReady", {}, (meta, args) => {});
  });
  let moveLoop = () => {
    if(!game_model || !game_model.gamedata) {
      return [];
    }
    let color = game_model.metadata.white === game_model.user ? 
      Color.WHITE : Color.BLACK;
    let now = Date.now();
    let gamestate = game_model.gamedata.history.head;
    let eStart = color === Color.WHITE ? gamestate.wStart : gamestate.bStart;
    let elixirAmount = getElixirCount(game_model.gamedata, now, color);
    if(elixirAmount < 1) {
      return [eStart + ELIXIR];
    }
    let move = selectMove(game_model.gamedata, color, now);
    if(move) {
      socket.notify("move", move, (meta, args) => {});
      return [Math.max(now + DELAY, eStart + 2 * ELIXIR)];
    }
    return [];
  }
  let scheduler = new Scheduler(moveLoop, interval, reactionTime);
  game_model.addListener({
    metaUpdated: () => {},
    boardUpdated: () => {scheduler.react()},
    chatUpdated: () => {},
    gameOver: () => {
      scheduler.stop(); 
      socket.notify("createOpenChallenge", {}, () => {});
    },
    gameStarted: () => {scheduler.start();},
  });
}

//function runBotLocal(moveValue, elixirValue, interval, reactionTime, 
//  servergame, username) {
//  let moveLoop = () => {
//    let color = servergame.white === username ? 
//      Color.WHITE : Color.BLACK;
//    let move = selectMove(servergame.gameState, color, moveValue, elixirValue, 1);
//    if(move) {
//      let {iRow, iCol, fRow, fCol} = move;
//      let now = Date.now();
//      servergame.move(iRow, iCol, fRow, fCol, color, now);
//      return [now + DELAY];
//    }
//    return [];
//  }
//  let scheduler = new Scheduler(moveLoop, interval, reactionTime);
//  servergame.addListener({
//    metaUpdate: () => {},
//    boardUpdate: () => {scheduler.react()},
//    chatUpdate: () => {},
//    gameOver: () => {scheduler.stop();},
//    gameStarted: () => {scheduler.start();},
//  });
//  servergame.setReady(username);
//}

export {runBot}
