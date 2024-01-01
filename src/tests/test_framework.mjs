import {Piece, pieceToString} from "../data/enums.mjs";

var correct = 0;
var total = 0;

/**
 * Runs a test named [name] with corresponding function [code].
 * [code] should be a function with no arguments that returns true if the
 * test passed or false if the test failed. [code] is allowed to crash.
 */
function test(name, code) {
  total++;
  try {
    let result = code();
    if(result) {
      console.log(name + ": PASS");
      correct++;
    } else {
      console.log(name + ": FAIL");
    }
  } catch(error) {
    console.log(name + ": CRASHED");
    console.log(error);
  }
}

/**
 * Checks whether two [ChessBoard] objects [b1] and [b2] have the
 * same configuration of pieces.
 */
function checkEq(b1, b2) {
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      if(b1.pieceAt(r, c) !== b2.pieceAt(r, c)) return false;
    }
  }
  return true;
}

/**
 * Checks whether the ChessBoard [board] has the configuration of pieces
 * specified by the string [str].
 */
function checkEqStr(board, str) {
  if(str.length !== 64) throw new Error("Incorrect string length");
  for(let r = 0; r < 8; r++) {
    for(let c = 0; c < 8; c++) {
      if(pieceToString(board.pieceAt(r, c)) !== str[8 * r + c]) return false;
    }
  }
  return true;
}

/**
 * Helper function for visualizing [board]
 */
function printBoard(board) {
  let output = [];
  for(let r = 7; r >= 0; r--) {
    for(let c = 0; c < 8; c++) {
      if(board.pieceAt(r, c) === Piece.NULL) output.push("/");
      else output.push(pieceToString(board.pieceAt(r, c)));
    }
    output.push("\n");
  }
  console.log(output.join(""));
}

/**
 * Prints the overall results of testing.
 */
function printResults() {
  console.log(correct + "/" + total + " tests passed");
}

export {test, checkEq, checkEqStr, printBoard, printResults};
