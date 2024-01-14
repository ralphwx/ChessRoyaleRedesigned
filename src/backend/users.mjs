import fs from "fs";
import {makeSalt, makeHash} from "./crypto.mjs";

function _validateUsernameCharacter(c) {
  return ('0' <= c && c <= '9') 
    || ('a' <= c && c <= 'z') 
    || ('A' <= c && c <= 'Z') 
    || (c === '_');
}

/** 
 * Data structure for managing user logins and elo ratings.
 */
class UserManager {
  constructor(path) {
    this.path = path;
    if(path[path.length - 1] !== '/') this.path += '/';
  }
  _parseFile(username) {
    if(!this.userExists(username)) throw "Exception occurred";
    let output;
    return JSON.parse(fs.readFileSync(this.path + username));
  }
  /**
   * Checks whether [username] is a valid username. Valid usernames are of type
   * string and contain only letters, numbers, and underscores.
   */
  validUsername(username) {
    if(typeof username !== "string") return false;
    if(username.length === 0) return false;
    for(let i = 0; i < username.length; i++) {
      if(!_validateUsernameCharacter(username[i])) return false;
    }
    return true;
  } 
  userExists(username) {
    if(this.validUsername(username)) {
      return fs.existsSync(this.path + username);
    }
    return false;
  }
  
  /**
   * Returns true if the username password combo is correct
   */
  authenticate(username, password) {
    if(!this.userExists(username)) return false;
    let userData = this._parseFile(username);
    return makeHash(password + userData.salt) === userData.password;
  }
  
  getElo(username) {
    return this._parseFile(username).elo;
  }
  
  recordWin(username, opponentElo) {
    let data = this._parseFile(username);
    let elo = data.elo
    let prior = 8 + Math.round((opponentElo - elo) / 60);
    if(prior > 16) prior = 16;
    if(prior < 0) prior = 0;
    let factor = 1 + 0.1 * data.winStreak;
    if(factor > 2) factor = 2;
    data.elo += Math.round(factor * prior);
    data.winStreak += 1;
    fs.writeFileSync(this.path + username, JSON.stringify(data));
  }

  recordLoss(username, opponentElo) {
    let data = this._parseFile(username);
    let elo = data.elo;
    let prior = 8 + Math.round((elo - opponentElo) / 60);
    if(prior > 16) prior = 16;
    if(prior < 0) prior = 0;
    data.elo -= Math.round(prior);
    data.winStreak = 0;
    fs.writeFileSync(this.path + username, JSON.stringify(data));
  }

  setElo(username, elo) {
    let userData = this._parseFile(username);
    userData.elo = elo;
    fs.writeFileSync(this.path + username, JSON.stringify(userData));
  }
  
  createUser(username, password) {
    if(!this.validUsername(username)) throw "invalid username: " + username;
    if(this.userExists(username)) throw "User " + username + " already exists";
    let salt = makeSalt(10);
    let s = JSON.stringify({
      username: username,
      salt: salt,
      password: makeHash(password + salt),
      elo: 1000,
      winStreak: 0,
    });
    fs.writeFileSync(this.path + username, s);
  }
  
  deleteUser(username, password) {
    if(!this.userExists(username)) throw "User " + username + " does not exist";
    fs.unlink(this.path + username, (err) => {
      if(err) throw err;
    });
  }
}
export {UserManager};
