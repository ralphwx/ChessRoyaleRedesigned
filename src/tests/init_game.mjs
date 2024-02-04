
import {connect} from "../frontend/metaauthclient.mjs";
import {URL, LoginType} from "../data/enums.mjs";

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

let main = async () => {
  let socket1 = await promiseConnect("devralph1", "password");
  let socket2 = await promiseConnect("devralph2", "password");
  await send(socket1, "createOpenChallenge");
  await send(socket2, "acceptChallenge", socket1.user);
  await send(socket2, "declareReady");
  console.log("done");
};

main();
