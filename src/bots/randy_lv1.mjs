
import {computeFeatures} from "./chess_extension.mjs";
import {Color, colorOf} from "../data/enums.mjs";
import {GameData, Move} from "../data/gamedata.mjs";

class DemoBot {
  elixirValue(e) {
    return 0;
  }
  moveValue(iRow, iCol, fRow, fCol, board) {
    return 1;
  }
}

export {DemoBot}
