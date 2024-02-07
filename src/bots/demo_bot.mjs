
import {computeFeatures} from "./chess_extension.mjs";
import {Color, colorOf} from "../data/enums.mjs";
import {GameData, Move} from "../data/gamedata.mjs";

class DemoBot {
  elixirValue(e) {
    return 2.5 / e;
  }
  moveValue(iRow, iCol, fRow, fCol, board) {
    let color = colorOf(board.pieceAt(iRow, iCol));
    let features = computeFeatures(iRow, iCol, fRow, fCol, board);
    let output = 0;
    output += 2 * features.is_capture;
    output += 1 * features.capture_up;
    output += 0.5 * features.center_bonus;
    output += 0.3 * features.forward;
    output += 3 * features.castling;
    output += -2 * features.hanging;
    return output;
  }
}

export {DemoBot}
