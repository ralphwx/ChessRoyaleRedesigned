
import {computeFeatures} from "./chess_extension.mjs";
import {Color, colorOf} from "../data/enums.mjs";
import {GameData, Move} from "../data/gamedata.mjs";

class DemoBot {
  elixirValue(e) {
    return 2.5 / e;
  }
  moveValue(iRow, iCol, fRow, fCol, gamedata) {
    let board = gamedata.getBoard();
    let color = colorOf(board.pieceAt(iRow, iCol));
    let move = new Move(color, Date.now(), iRow, iCol, fRow, fCol);
    if(!gamedata.isLegalMove(move)) return -100;
    let features = computeFeatures(iRow, iCol, fRow, fCol, gamedata.getBoard());
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

let data = new GameData(Date.now() - 8000);
console.log((new DemoBot()).moveValue(1, 4, 3, 4, data));

export {DemoBot}
