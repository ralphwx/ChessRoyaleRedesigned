
import {computeFeatures} from "./chess_extension.mjs";

class DemoBot {
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
    output += 3 * features.castling;
    return output;
  }
}

export {DemoBot}
