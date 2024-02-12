import {connect} from "../frontend/metaauthclient.mjs";
import {URL, LoginType} from "../data/enums.mjs";

function promiseCreate(username, password) {
  return new Promise((resolve, reject) => {
    connect(URL, username, password, LoginType.CREATE, undefined,
    (socket) => {resolve(socket)},
    (msg) => {reject(msg)});
  });
}

let main = async () => {
  await promiseCreate("spectatorralph", "password");
};

main();
