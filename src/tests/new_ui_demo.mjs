
import {connect} from "../frontend/metaauthclient.mjs";
import {Color, URL, LoginType, Location, ELIXIR} from "../data/enums.mjs";
import {GameModel} from "../frontend/game_model.mjs";
import {DemoBot} from "../bots/demo_bot.mjs";
import {runBot} from "../bots/bot_frame.mjs";


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
  async function newGame() {
    await send(socket1, "createOpenChallenge");
    await send(socket2, "acceptChallenge", socket1.user);
  }
  let socket1 = await promiseConnect("devralph1", "password");
  let socket2 = await promiseConnect("devralph2", "password");
  let bot_socket = await promiseConnect("devralph2", "password");
  let loc = await send(socket1, "redirect?");
  if(loc === Location.LOBBY) {
    newGame();
  }
  socket2.addEventHandler("gameOver", (meta, args) => {
    send(socket2, "createPrivateChallenge", socket1.user);
  });
  let bot = new DemoBot();
  runBot(bot.moveValue, bot.elixirValue, 1000, 300, bot_socket);
};

main();
