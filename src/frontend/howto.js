import React from "react";
import ReactDOM from "react-dom/client";
import {HeaderRow} from "./header.js";
import "./howto.css";
import {URL} from "../data/enums.mjs";
import {HoverButton} from "./hoverbutton.js";

class Main extends React.Component {
  goPlay() {
    window.location.replace(URL);
  }
  render() {
    return <div>
      <HeaderRow />
      <div className="maintext">
        <h2>How to play Chess Royale</h2>
        <p>Welcome to the exciting world of Chess Royale! This game is based on chess, and has almost identical rules. The key difference is that while chess is a turn-based game, with players alternating moves, Chess Royale is a resource-based game, where each move costs 1 resource.</p>
        <p>Every four seconds, each player will receive one resource, symbolized by small purple squares just below the chessboard. Players may either spend that resource to make a move immediately on the chess board or store up that resource for future moves. Stocking up multiple resources can allow the player to make multiple moves in quick succession, creating cool tactical opportunities! Please note that the resource system treats all moves equally - moving a pawn, moving a rook, and castling all cost the same amount: one resource.</p>
        <p>However, it would be unfair if a player could make several moves in quick succession with the same piece - imagine a situation where the queen infiltrates and takes all your pieces without giving you a chance to react. Therefore, after a piece moves, it is placed on a two-second cooldown before it is allowed to move again.</p>
        <p>The movement mechanics of the game are almost identical to that of chess. There are, however, a few key differences:</p>
        <ul>
          <li>There is no concept of checks, checkmate, or stalemate in Chess Royale. Instead, the game ends when one of the kings is captured or a player resigns. This also means that moves that voluntarily place your king in check, which would be illegal in regular chess, are allowed in Chess Royale.</li>
          <li>Draws in Chess Royale are exceedingly rare; they may occur only if both players agree to a draw. This is because even in a king vs king position, one king could in principle capture the other king.</li>
          <li>Kings are allowed to castle into check, however, like regular chess, kings are not allowed to castle through check. In regular chess, there are positions where the enemy king is prevented from castling because a bishop or some other piece covers the square next to the king. To preserve this strategical aspect of regular chess, this rule was set in place for Chess Royale. Such a limitation was not placed on castling into check because it would allow the other player to immediately win the game by king capture.</li>
          <li>En passant is implemented in Chess Royale, and abides by the following rules: a pawn is susceptible to be captured by en passant if it moves two squares forward and stands one horizontal square away from an enemy pawn, the pawn is still there when en passant is initiaed, and the player who initiates en passant has made no moves between the susceptible pawn being pushed two squares and initiating en passant, except possibly for the en passant capture of another pawn. This rule can be more simply summarized as: en passant works exactly the same as in regular chess; the opportunity for a player to initiate en passant is lost if the pawn moves away or if the player makes some other move that is not en passant.</li>
          <li>When pawns promote, they always promote to queen. The developer was lazy :)</li>
        </ul>
        <p>{"These rules may sound complicated, but everything will make sense after playing a few games. Good luck have fun!"}</p>
      </div>
      <HoverButton 
        innerHTML={"Go play!"}
        innerHTMLHover={"Go play!"}
        className={"goplaybutton"}
        classNameHover={"goplaybutton goplayhover"}
        onClick={() => this.goPlay()}
      />
    </div>
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
