
import {promiseConnect, guestConnect, spectateConnect, send, sleep} from "./server_test_framework.mjs"
import {test, printResults} from "./test_framework.mjs";
import {ELIXIR, Location} from "../data/enums.mjs";

let main = async () => {
  let s1 = await promiseConnect("devralph1", "password");
  await send(s1, "saveGame", {});
  await send(s1, "loadGame", "nonexistent");
  await send(s1, "getUserInfo", "nonexistent");
  await send(s1, "declareReady");
  await send(s1, "move");
  await send(s1, "message", "MOOOOO");
  s1.disconnect();
  let s2 = await guestConnect();
  await send(s2, "saveGame", {});
  await send(s2, "loadGame", "nonexistent");
  await send(s2, "getUserInfo", "nonexistent");
  await send(s2, "declareReady");
  await send(s2, "move");
  await send(s2, "message", "MOOOOO");
  s2.disconnect();
  let s3 = await spectateConnect("ralphwx", "asdfghjkl;", "devralph2");
  await send(s3, "saveGame", {});
  await send(s3, "loadGame", "nonexistent");
  await send(s3, "getUserInfo", "nonexistent");
  await send(s3, "declareReady");
  await send(s3, "move");
  await send(s3, "message", "MOOOOO");
  let s4 = await promiseConnect("devralph1", "password");
  let s5 = await promiseConnect("devralph2", "password");
  await send(s4, "createOpenChallenge");
  await send(s5, "acceptChallenge", "devralph1");
  let chat1 = await send(s4, "getChat", {i: 0});
  await send(s3, "message", "MOOOOOO");
  let chat2 = await send(s4, "getChat", {i: 0});
  test("Disable spectator chat", () => {return chat1.length === chat2.length});
  await sleep(ELIXIR + 1);
  await send(s3, "move", {iRow: 1, iCol: 4, fRow: 3, fCol: 4});
  await send(s3, "move", {iRow: 6, iCol: 4, fRow: 4, fCol: 4});
  let gamedata = await send(s3, "getGameData", {i:0, user:"devralph2"});
  test("Disable spectator moves", () => {
    return gamedata.moves.length === 0;
  });
  let l = await send(s4, "redirect?");
  test("Server still running?", () => {
    return l === Location.GAME;
  });
  printResults();
};

main();
