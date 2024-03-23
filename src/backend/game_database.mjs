import {encodeGameData} from "../data/gamedataencoder.mjs";
import {generateCustomUuid} from "custom-uuid";
import fs from "fs";

let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

class GameDatabase {
  constructor(root) {
    this.root = root;
  }
  /**
   * Asks this database to save a completed game. [gamedata] is the gamedata, 
   * encoded as a string. [white] and [black] are the usernames of the players,
   * and [whiteElo] and [blackElo] are the elo ratings of the players.
   * A string [id] is returned, which can later be used to fetch the game data.
   * Required: [gamedata] must be a valid string encoding of a game.
   */
  save(gamedata, white, black, whiteElo, blackElo) {
    let data = {
      white : white,
      black : black,
      whiteElo : whiteElo,
      blackElo : blackElo,
      date : Date.now(),
      gamedata : gamedata,
    }
    let id = generateCustomUuid(chars, 7);
    fs.writeFileSync(this.root + id, JSON.stringify(data));
    return id;
  }
  gameExists(id) {
    return fs.existsSync(this.root + id);
  }
  /**
   * Returns an object {white, black, whiteElo, blackElo, date, gamedata}
   * corresponding to the game with id [id]
   * 
   * [date] is a millisecond value from Date.now() when the game was completed;
   * [gamedata] is the encoded string form of the game.
   */
  load(id) {
    let filename = this.root + id;
    let output = JSON.parse(fs.readFileSync(filename));
    return output;
  }
}

export {GameDatabase}
