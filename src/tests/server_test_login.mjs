
import {promiseConnect, guestConnect, spectateConnect, send, sleep} from "./server_test_framework.mjs";
import {test, printResults} from "./test_framework.mjs";
import io from "socket.io-client";
import {URL, LoginType} from "../data/enums.mjs";

/**
 * Some tests that attempt to crash the server via login mechanics
 */
let main = async () => {
  let s1 = await promiseConnect("devralph1", "password");
  s1.disconnect();
  let s2 = await guestConnect();
  s2.disconnect();
  let s3 = await spectateConnect("devralph2", "password", "devralph1");
  s3.disconnect();
  let t1 = () => {
    return true;
  }
  test("Successful disconnection", t1);
  let rs = io(URL, {transports:["websocket"]});
  rs.emit("lobbyData");
  rs.disconnect();
  let rs2 = io(URL, {transports:["websocket"]});
  rs2.emit("login");
  rs2.disconnect();
  let rs3 = io(URL, {transports:["websocket"]});
  rs3.emit("login", "devralph1", "password", LoginType.REPLAY, undefined);
  rs3.disconnect();
  let rs4 = io(URL, {transports:["websocket"]});
  rs4.emit("login", "devralph2", "p@ssword", LoginType.LOGIN, undefined);
  rs4.disconnect();
  let rs5 = io(URL, {transports:["websocket"]});
  rs5.emit("login", "fakeralph", "password", LoginType.LOGIN, undefined);
  rs5.disconnect();
  let rs6 = io(URL, {transports:["websocket"]});
  rs6.emit("login", "devralph1", "password", LoginType.SPECTATE, "fakeralph");
  rs6.disconnect();
  let rs7 = io(URL, {transports:["websocket"]});
  rs7.emit("login", "devralph1", "password", LoginType.SPECTATE, undefined);
  rs7.disconnect();
  let rs8 = io(URL, {transports:["websocket"]});
  rs8.emit("login", "fakeralph", "password", LoginType.SPECTATE, "fakeralph");
  rs8.disconnect();
  let rs9 = io(URL, {transports:["websocket"]});
  rs9.emit("login", "devralph1", "p@ssword", LoginType.SPECTATE, "devralph2");
  rs9.disconnect();
  await sleep(500);
  test("Finished login hack attempts", t1);
  let s4 = await guestConnect();
  let data = await send(s4, "lobbyData");
  let t3 = () => {
    return data.open.length === 0;
  };
  test("Server still running", t3);
  printResults();
};

main();
