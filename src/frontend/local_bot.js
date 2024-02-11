
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./frontend/controller.mjs";
import {LocalModel} from "./frontend/local_model.mjs";
import {ServerGame} from "./backend/servergame.mjs";
import {Game} from "./frontend/game_screen.js";
import {runBotLocal} from "./bots/bot_frame.mjs";
import {DemoBot} from "./bots/demo_bot.mjs";
import {LoginType} from "./data/enums.mjs";

let user = "devralph1";
let loginType = LoginType.LOGIN;

let game = new ServerGame(user, "demo_bot");
let model = new LocalModel(user, game, "1000", "1000");
let controller = new Controller(model, loginType);
let view = <Game controller={controller} />

let bot = new DemoBot();
runBotLocal(bot.moveValue, bot.elixirValue, 1000, 300, game, "demo_bot");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(view);

