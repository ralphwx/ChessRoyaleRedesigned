import {connect} from "../frontend/metaauthclient.mjs";
import {LoginType, Color, ELIXIR, DELAY, Location} from "../data/enums.mjs";
import {selectMove} from "./chess_extension_sophie.mjs";
import {Scheduler} from "./bot_frame.mjs";
import {GameModel} from "../frontend/game_model.mjs";

connect("https://royalechess.org", "BOT_SOPHIE", "Iamyouroverlord", LoginType.LOGIN, undefined, (socket) => {
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
    let now = Date.now();
    let color = game_model.metadata.white === game_model.user ? 
      Color.WHITE : Color.BLACK;
    let gamestate = game_model.gamedata.history.head;
    let move = selectMove(gamestate, now, color, 1);
    let elixir = color === Color.WHITE ? (now - gamestate.wStart) / ELIXIR :
      (now - gamestate.bStart) / ELIXIR;
    console.log("Elixir amount: " + elixir);
    console.log("Selected move: ");
    console.log(move);
    console.log("elixir value: " + 3.5 / elixir);
    if(move[0] && move[1] >= 3.5 / elixir) {
      socket.notify("move", move[0], (meta, args) => {});
    }
  };
  let scheduler = new Scheduler(moveLoop, 1000, 200);
  game_model.addListener({
    metaUpdated: () => {},
    boardUpdated: () => {scheduler.react()},
    chatUpdated: () => {},
    gameOver: () => {
      scheduler.stop();
      socket.notify("createOpenChallenge", {}, () => {});
    },
    gameStarted: () => {setTimeout(() => {scheduler.start()}, 2000)},
  });
}, (msg) => {
  console.log(msg);
});
