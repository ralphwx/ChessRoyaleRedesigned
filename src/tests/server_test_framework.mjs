
import {connect} from "../frontend/metaauthclient.mjs";
import {URL, LoginType} from "../data/enums.mjs";

function promiseConnect(username, password) {
  return new Promise((resolve, reject) => {
    connect(URL, username, password, LoginType.LOGIN, undefined,
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
    connect(URL, undefined, undefined, LoginType.GUEST, undefined,
      (socket) => {
        resolve(socket);
      }, (msg) => {
        reject(msg);
      });
  });
}

function spectateConnect(username, password, target) {
  return new Promise((resolve, reject) => {
    connect(URL, username, password, LoginType.SPECTATE, target,
      (socket) => {
        resolve(socket);
      }, (msg) => {
        reject(msg);
      });
  });
}

function send(socket, eventName, data) {
  return new Promise((resolve) => {
    let fallback = setTimeout(() => {
      console.log("Event " + eventName + " failed to get callback");
      resolve(undefined);
    }, 2000);
    socket.notify(eventName, data, (meta, args) => {
      clearTimeout(fallback);
      resolve(args);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {resolve()}, ms);
  });
}

export {promiseConnect, guestConnect, spectateConnect, send, sleep};
