
import {connect} from "../frontend/metaauthclient.mjs";
import {Color, URL, LoginType, ELIXIR} from "../data/enums.mjs";
import {GameModel} from "../frontend/game_model.mjs";
import {DemoBot} from "./demo_bot.mjs";


function promiseConnect(username, password) {
  return new Promise((resolve, reject) => {
    connect(URL, username, password, LoginType.LOGIN,
      (socket) => {
        resolve(socket);
      }, (msg) => {
        reject(msg);
      });
  });
}

function send(socket, eventName, data) {
  return new Promise((resolve) => {
    socket.notify(eventName, data, (meta, args) => {
      resolve(args);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {resolve()}, ms);
  });
}

let main = async () => {
  let model;
  async function newGame() {
    await sleep(10000);
    await send(socket1, "createOpenChallenge");
    await send(socket2, "acceptChallenge", socket1.user);
    await send(socket2, "declareReady");
    model.refreshGameData();
    model.refreshMetaData();
    model.refreshChat();
  }
  let socket1 = await promiseConnect("devralph1", "password");
  let socket2 = await promiseConnect("devralph2", "password");
  let bot_socket = await promiseConnect("devralph2", "password");
  newGame();
  socket2.addEventHandler("gameOver", (meta, args) => {
    newGame();
  });
  model = new GameModel("devralph2", bot_socket);
  let bot = new DemoBot();
  setInterval(() => {
    let now = Date.now();
    if(model.gamedata === undefined) return;
    let board = model.gamedata.getBoard();
    let color = model.metadata.white === model.user ? Color.WHITE : Color.BLACK;
    let legalMoves = board.listLegalMoves(color);
    let values = [];
    let max_value = -100;
    for(let [iRow, iCol, fRow, fCol] of legalMoves) {
      let value = bot.moveValue(iRow, iCol, fRow, fCol, model.gamedata);
      if(value > max_value) max_value = value;
      values.push(value);
    }
    let elixirStart = color === Color.WHITE ? 
      model.gamedata.history.head.wStart : model.gamedata.history.head.bStart;
    let elixirCount = (now - elixirStart) / ELIXIR;
    if(max_value < bot.elixirValue(elixirCount) && elixirCount < 9) return;
    let probs = [];
    for(let value of values) {
      probs.push(Math.exp((value - max_value)));
    }
    let sum = 0;
    for(let p of probs) sum += p;
    let target = Math.random();
    let cumulative_pr = 0;
    for(let i = 0; i < probs.length - 1; i++) {
      cumulative_pr += probs[i] / sum;
    }
    let i = 0;
    for(; i < probs.length - 1; i++) {
      target -= probs[i] / sum;
      if(target < 0) {
        break;
      }
    }
    let move = legalMoves[i];
    bot_socket.notify("move", {iRow: move[0], iCol: move[1], fRow: move[2], fCol: move[3]}, (meta, args) => {});
  }, 500);
};

main();
