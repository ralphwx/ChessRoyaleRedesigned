
import {connect} from "../frontend/metaauthclient.mjs";
import {LoginType, Location, DELAY, ELIXIR, Color, GameOverCause} from "../data/enums.mjs";
import {test, printResults, checkEq, checkEqStr, printBoard} from "./test_framework.mjs";
import {GameData} from "../data/gamedata.mjs";
import {ChatLog} from "../data/chat_log.mjs";

//Two test users, devralph1 and devralph2, are already created. Both users use
// "password" as their password

function promiseConnect(username, password) {
  return new Promise((resolve, reject) => {
    connect("http://localhost:8080", username, password, LoginType.LOGIN, 
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
  let socket1 = await promiseConnect("devralph1", "password");
  if(typeof socket1 === "string") {
    console.log(socket1);
    return;
  }
  let socket2 = await promiseConnect("devralph2", "password");
  if(typeof socket2 === "string") {
    console.log(socket2);
    return;
  }
  let gamedata = undefined;
  let metadata = undefined;
  let chat = [];
  let gameResult = undefined;
  let cause = undefined;
  function refreshGameData() {
    return new Promise((resolve) => {
      let startIndex = gamedata === undefined ? 0 : gamedata.history.length - 1;
      socket1.notify("getGameData", startIndex, (meta, args) => {
        if(args.startTime === undefined) {
          gamedata = undefined
          resolve();
          return;
        }
        if(!gamedata) gamedata = new GameData(args.startTime);
        for(let move of args.moves) gamedata.move(move);
        resolve();
      });
    });
  }
  function refreshMetaData() {
    return new Promise((resolve) => {
      socket1.notify("getMetaData", {}, (meta, args) => {
        metadata = args;
        resolve();
      });
    });
  }
  function refreshChat() {
    return new Promise((resolve) => {
      socket1.notify("getChat", chat.length, (meta, args) => {
        for(let pair of args) {
          chat.push(pair);
        }
        resolve();
      });
    });
  }
  socket1.addEventHandler("boardUpdate", (meta, args) => {
    if(gamedata.history.length === args.i) {
      for(let move of args.moves) gamedata.move(move);
    } else {
      refreshGameData();
    }
  });

  socket1.addEventHandler("chatUpdate", (meta, args) => {
    if(args.i === chat.length) {
      for(let message of args.messages) chat.push(message);
    } else {
      refreshChat();
    }
  });
  
  socket1.addEventHandler("metaUpdate", (meta, args) => {
    metadata = args.data;
  });

  socket1.addEventHandler("gameOver", (meta, args) => {
    gameResult = args.data.gameOverResult;
    cause = args.data.gameOverCause;
  });

  socket1.addEventHandler("gameStarted", (meta, args) => {
    gamedata = new GameData(args);
  });

  await send(socket1, "createOpenChallenge");
  await send(socket2, "acceptChallenge", socket1.user);
  let args1 = await send(socket1, "redirect?");
  let args2 = await send(socket2, "redirect?");
  test("successfully joined game", () => {
    return args1 === Location.GAME
      && args2 === Location.GAME;
  });
  
  await refreshMetaData();
  //ensure socket1 is playing with white
  if(metadata.white !== socket1.user) {
    let temp = socket1;
    socket1 = socket2;
    socket2 = temp;
  }
  //Test attempt to make moves before game started
  await send(socket1, "declareReady");
  await sleep(ELIXIR);
  await send(socket1, "move", {iRow: 1, iCol: 4, fRow: 3, fCol: 4});
  await send(socket2, "declareReady");
  await refreshGameData();
  
  test("no move before ready", () => {
    return checkEqStr(gamedata.getBoard(), "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr");
  });

  await send(socket2, "move", {iRow: 6, iCol: 4, fRow: 4, fCol: 4});
  test("no move without elixir", () => {
    return checkEqStr(gamedata.getBoard(), "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr");
  });

  await sleep(ELIXIR);
  await send(socket1, "move", {iRow: 1, iCol: 4, fRow: 3, fCol: 4});
  await send(socket2, "move", {iRow: 6, iCol: 4, fRow: 4, fCol: 4});
  test("normal moves", () => {
    return checkEqStr(gamedata.getBoard(), "RNBQKBNRPPPP PPP            P       p           pppp ppprnbqkbnr");
  });

  await sleep(2 * ELIXIR);
  await send(socket1, "move", {iRow: 0, iCol: 6, fRow: 2, fCol: 5});
  await send(socket1, "move", {iRow: 2, iCol: 5, fRow: 4, fCol: 4});
  test("delay enforced", () => {
    return checkEqStr(gamedata.getBoard(), "RNBQKB RPPPP PPP     N      P       p           pppp ppprnbqkbnr");
  });

  await send(socket1, "message", "hello");
  test("chat message 1", () => {
    return chat[chat.length - 1].sender === socket1.user
      && chat[chat.length - 1].message === "hello";
  });

  await send(socket2, "message", "world");
  test("chat message 2", () => {
    return chat[chat.length - 1].sender === socket2.user
      && chat[chat.length - 1].message === "world";
  });

  await sleep(2 * ELIXIR);
  await send(socket1, "move", {iRow: 0, iCol: 5, fRow: 3, fCol: 2});
  await sleep(DELAY);
  await send(socket1, "move", {iRow: 3, iCol: 2, fRow: 6, fCol: 5});

  //check game, meta, chat synchronization features before ending this game
  let gamedata2;
  await new Promise((resolve) => {
    socket2.notify("getGameData", 0, (meta, args) => {
      gamedata2 = new GameData(args.startTime);
      for(let move of args.moves) gamedata2.move(move);
      resolve();
    });
  });
  let chat2 = [];
  await new Promise((resolve) => {
    socket2.notify("getChat", 0, (meta, args) => {
      for(let pair of args) {
        chat2.push(pair);
      }
      resolve();
    });
  });
  let meta2 = {};
  await new Promise((resolve) => {
    socket2.notify("getMetaData", {}, (meta, args) => {
      meta2 = args;
      resolve();
    });
  });
  test("midgame synchronization", () => {
    for(let key in metadata) {
      if(metadata[key] !== meta2[key]) return false;
    }
    for(let key in meta2) {
      if(metadata[key] !== meta2[key]) return false;
    }
    return checkEq(gamedata.getBoard(), gamedata2.getBoard())
      && JSON.stringify(chat) === JSON.stringify(chat2);
  });

  await sleep(DELAY);
  await send(socket1, "move", {iRow: 6, iCol: 5, fRow: 7, fCol: 4});
  await sleep(100);
  test("game over by king capture", () => {
    return gameResult === Color.WHITE
      && cause === GameOverCause.KING;
  });

  args1 = await send(socket1, "redirect?");
  args2 = await send(socket2, "redirect?");
  test("return to lobby on game end", () => {
    return args1 === Location.LOBBY
      && args2 === Location.LOBBY;
  });

  await send(socket2, "createOpenChallenge");
  await send(socket1, "acceptChallenge", socket2.user);
  await send(socket1, "declareReady");
  await send(socket2, "declareReady");
  if(metadata.white !== socket1.user) {
    let temp = socket1;
    socket1 = socket2;
    socket2 = temp;
  }
  await send(socket1, "resign");
  test("game end by resignation", () => {
    return gameResult === Color.BLACK
      && cause === GameOverCause.RESIGN;
  });

  await send(socket2, "createOpenChallenge");
  await send(socket1, "acceptChallenge", socket2.user);
  await send(socket1, "declareReady");
  await send(socket2, "declareReady");
  if(metadata.white !== socket1.user) {
    let temp = socket1;
    socket1 = socket2;
    socket2 = temp;
  }
  await send(socket2, "offerDraw");
  await send(socket1, "offerDraw");
  test("game end by draw agreed", () => {
    return gameResult === Color.NONE
      && cause === GameOverCause.AGREE;
  });
  printResults();
};

main();
