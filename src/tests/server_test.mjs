
import {connect} from "../frontend/metaauthclient.mjs";
import {LoginType, Location, URL} from "../data/enums.mjs";
import {test, printResults} from "./test_framework.mjs";

//Two test users, devralph1 and devralph2, are already created. Both users
// use "password" as their password

function promiseConnect(username, password) {
  return new Promise((resolve, reject) => {
    connect(URL, username, password, LoginType.LOGIN,
      (socket) => {
        resolve(socket);
      }, (msg) => {
        reject(msg);
      }
    )
  });
}

function guestConnect() {
  return new Promise((resolve, reject) => {
    connect(URL, undefined, undefined, LoginType.GUEST,
      (socket) => {
        resolve(socket);
      }, (msg) => {
        reject(msg);
      });
  });
}

function returningGuestConnect(username) {
  return new Promise((resolve, reject) => {
    connect(URL, username, undefined, LoginType.GUEST,
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

  //Test redirect? from lobby
  let args = await send(socket1, "redirect?");
  test("redirect? 1", () => {
    return args === Location.LOBBY;
  });
  
  //Test lobbyData while lobby is empty
  args = await send(socket1, "lobbyData");
  test("empty lobby", () => {
    return args.open.length === 0
      && args.incoming.length === 0
      && args.outgoing.length === 0;
  });

  //Test openChallenge
  await send(socket1, "createOpenChallenge");
  let args1 = await send(socket1, "lobbyData");
  let args2 = await send(socket2, "lobbyData");
  test("open challenge 1", () => {
    return args1.open.length === 1
      && args1.open.includes("devralph1")
      && args2.open.length === 1
      && args2.open.includes("devralph1")
      && args1.incoming.length === 0
      && args1.outgoing.length === 0
      && args2.incoming.length === 0
      && args2.outgoing.length === 0;
  });

  //Test privateChallenge
  await send(socket2, "createPrivateChallenge", "devralph1");
  args1 = await send(socket1, "lobbyData");
  args2 = await send(socket2, "lobbyData");
  test("private challenge 1", () => {
    return args1.open.length === 1
      && args1.open.includes("devralph1")
      && args2.open.length === 1
      && args2.open.includes("devralph1")
      && args1.incoming.length === 1
      && args1.incoming.includes("devralph2")
      && args2.incoming.length === 0
      && args1.outgoing.length === 0
      && args2.outgoing.length === 1
      && args2.outgoing.includes("devralph1");
  });

  //Test cancelChallenge
  await send(socket1, "cancelChallenge");
  args1 = await send(socket1, "lobbyData");
  args2 = await send(socket2, "lobbyData");
  test("cancel challenge", () => {
    return args1.open.length === 0
      && args2.open.length === 0
      && args1.incoming.length === 1
      && args2.outgoing.length === 1
      && args1.outgoing.length === 0
      && args2.incoming.length === 0;
  });
  
  //Test accepting a cancelled challenge
  await send(socket2, "acceptChallenge", "devralph1");
  args1 = await send(socket1, "lobbyData");
  args2 = await send(socket2, "lobbyData");
  let loc1 = await send(socket1, "redirect?");
  let loc2 = await send(socket2, "redirect?");
  test("accept cancelled challenge", () => {
    return loc1 === Location.LOBBY
      && loc2 === Location.LOBBY
      && args1.incoming.length === 1
      && args2.outgoing.length === 1;
  });

  //Test accepting private challenge
  await send(socket1, "acceptChallenge", "devralph2");
  args1 = await send(socket1, "lobbyData");
  args2 = await send(socket2, "lobbyData");
  loc1 = await send(socket1, "redirect?");
  loc2 = await send(socket2, "redirect?");
  test("accept private challenge", () => {
    return loc1 === Location.GAME
      && loc2 === Location.GAME
      && args1.open.length === 0
      && args2.open.length === 0
      && args1.incoming.length === 0
      && args1.outgoing.length === 0
      && args2.incoming.length === 0
      && args2.outgoing.length === 0;
  });

  //Abort, check that both players correctly aborted
  await send(socket2, "abort");
  loc1 = await send(socket1, "redirect?");
  loc2 = await send(socket2, "redirect?");
  test("abort game", () => {
    return loc1 === Location.LOBBY;
    return loc2 === Location.LOBBY;
  });

  //Test accepting open challenge and joining game cancels challenge
  //Also test that older challenges appear first in the lobby
  await send(socket1, "createOpenChallenge");
  await send(socket2, "createOpenChallenge");
  args1 = await send(socket1, "lobbyData");
  args2 = await send(socket2, "lobbyData");
  test("lobby order", () => {
    return args1.open.length === 2
      && args1.open[0] === "devralph1"
      && args1.open[1] === "devralph2"
      && args2.open.length === 2
      && args2.open[0] === "devralph1"
      && args2.open[1] === "devralph2";
  });
  await send(socket2, "acceptChallenge", "devralph1");
  loc1 = await send(socket1, "redirect?");
  loc2 = await send(socket2, "redirect?");
  args1 = await send(socket1, "lobbyData");
  args2 = await send(socket2, "lobbyData");
  test("accept open challenge", () => {
    return loc1 === Location.GAME
      && loc2 === Location.GAME
      && args1.open.length === 0
      && args2.open.length === 0;
  });

  //Test that guest lobby is not the same as users lobby
  let socket3 = await guestConnect();
  if(typeof socket3 === "string") {
    console.log(socket3);
    return;
  }
  let socket4 = await guestConnect();
  if(typeof socket4 === "string") {
    console.log(socket4);
    return;
  }
  let loc3  = await send(socket3, "redirect?");
  test("redirect from guest lobby", () => {
    return loc3 === Location.LOBBY;
  });

  await send(socket3, "createOpenChallenge");
  await send(socket1, "abort");
  await send(socket1, "createOpenChallenge");
  args2 = await send(socket2, "lobbyData");
  let args4 = await send(socket4, "lobbyData");
  test("separate lobbies", () => {
    return args2.open.length === 1
      && args2.open.includes("devralph1")
      && args4.open.length === 1
      && args4.open.includes(socket3.user);
  });
  
  //Test auto-matchmaking when two players private challenge each other
  await send(socket1, "createPrivateChallenge", socket2.user);
  await send(socket2, "createPrivateChallenge", socket1.user);
  args1 = await send(socket1, "redirect?");
  args2 = await send(socket2, "redirect?");
  test("private challenge auto matchmaking", () => {
    return args1 === Location.GAME
      && args2 === Location.GAME;
  });

  //Test self-enforced guest username
  let returningGuestSocket = await returningGuestConnect("Guest#21");
  test("returning guest username", () => {
    return returningGuestSocket.user === "Guest#21";
  });
  printResults();
};

main();
