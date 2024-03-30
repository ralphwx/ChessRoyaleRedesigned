import {computeFeatures} from "./chess_extension.mjs";
import {LoginType, URL} from "../data/enums.mjs";
import {GameData, Move} from "../data/gamedata.mjs";
import {runBot} from "./bot_frame.mjs";
import {connect} from "../frontend/metaauthclient.mjs";

class BotRandy {
  elixirValue(e) {
    return 3.5 / e;
  }
  moveValue(iRow, iCol, fRow, fCol, board) {
    let features = computeFeatures(iRow, iCol, fRow, fCol, board);
    if(features.capture_king) return 100;
    let output = 0;
    output += 2 * features.is_capture;
    output += 1 * features.capture_up;
    output += 0.5 * features.center_bonus;
    output += 0.3 * features.forward;
    output += 0.1 * features.open_lines_bonus;
    output += 3 * features.castling;
    output += -2 * features.hanging;
    output += 0.02 * features.oppo_hanging;
    output -= 0.1 * features.self_capturable;
    output += 0.01 * features.oppo_capturable;
    return output;
  }
}

connect(URL, "BOT_RANDY", "TwoUsersNow!!", LoginType.LOGIN, undefined, (socket) => {
  console.log("Connected");
  let bot = new BotRandy();
  runBot(bot.moveValue, bot.elixirValue, 1000, 200, socket);
}, (msg) => {
  console.log(msg);
});
