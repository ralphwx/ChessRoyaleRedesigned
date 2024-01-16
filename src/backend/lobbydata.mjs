
import {ServerGame} from "./servergame.mjs";
import {MultiMap} from "../data/maps.mjs";

/**
 * LobbyData keeps track of open challenges, private challenges, and a list
 * of ongoing games. LobbyData does not track offline bots.
 */
class LobbyData {
  //impl note
  //  openChallenges is a list of users who submitted an open challenge
  //  privateSenders is a map of users who submitted private challenges to
  //    the users they challenged
  //  privateReceivers is a map of users to a list of users that sent them
  //    private challenges
  //  games is a map from users to a list [opp, game] where [opp] is the
  //  opponent and [game] is a servergame object. Games stores the user's
  //  most recently played game, and this lobbydata object does not allow users
  //  to take part in multiple games at once.
  constructor() {
    this.openChallenges = [];
    this.privateSenders = new Map();
    this.privateReceivers = new MultiMap();
    this.games = new Map();
  }

  /**
   * Returns the list of users who have posted open challenges
   */
  publicChallenges() {
    return this.openChallenges;
  }

  /**
   * Returns the list of users who have sent [user] a private challenge
   */
  privateChallenges(user) {
    return this.privateReceivers.get(user);
  }

  /**
   * Returns the list of users to whom [user] sent a private challenge
   */
  outgoingChallenges(user) {
    let opponent = this.privateSenders.get(user);
    if(opponent) return [opponent];
    return [];
  }

  makeOpenChallenge(user) {
    if(this.isInGame(user)) return;
    if(this.openChallenges.indexOf(user) !== -1) return;
    this.cancelChallenge(user);
    this.openChallenges.push(user);
  }

  makePrivateChallenge(user, opponent) {
    if(this.isInGame(user)) return;
    this.cancelChallenge(user);
    this.privateSenders.set(user, opponent);
    this.privateReceivers.add(opponent, user);
  }

  cancelChallenge(user) {
    let index = this.openChallenges.indexOf(user);
    if(index !== -1) {
      this.openChallenges.splice(index, 1);
      return;
    }
    let privateOpponent = this.privateSenders.get(user);
    if(privateOpponent !== undefined) {
      this.privateSenders.delete(user);
      this.privateReceivers.remove(privateOpponent, user);
    }
  }

  /**
   * Attempts to start a game with [user] accepting the challenge issued by
   * [sender]. This can fail if:
   *  - If [sender] did not send a challenge that can be accepted by
   *    [user].
   *  - If either [sender] or [user] are in a game.
   * Returns true if the game was successfully started, false otherwise.
   */
  attemptJoin(user, sender) {
    if(this.isInGame(user)) return false;
    if(this.isInGame(sender)) return false;
    if(this.privateSenders.get(sender) === user
      || this.openChallenges.indexOf(sender) !== -1) {
      this.cancelChallenge(user);
      this.cancelChallenge(sender);
      let gamedata = (Math.random() < 0.5) ? new ServerGame(sender, user) :
        new ServerGame(user, sender);
      this.games.set(user, [sender, gamedata]);
      this.games.set(sender, [user, gamedata]);
      return true;
    }
    return false;
  }

  /**
   * Returns the ServerGame object representing the current state of the game
   * [user] is taking part in, or the ServerGame object representing the most
   * recent game that [user] played, or undefined if [user] has not yet played
   * any games.
   */
  getGame(user) {
    let output = this.games.get(user);
    if(!output) return undefined;
    return output[1];
  }

  /**
   * Returns true if the user is currently in a game that has not yet ended.
   */
  isInGame(user) {
    let data = this.games.get(user);
    return data && !data[1].gameOver;
  }
}

export {LobbyData};
