
import {ServerGame} from "./servergame.mjs";
import {MultiMap} from "../data/maps.mjs";

/**
 * LobbyData keeps track of open challenges, private challenges, and a list
 * of ongoing games. LobbyData does not track offline bots.
 */
class LobbyData {
  /**
   * Implementation note:
   *  [openChallenges] is a list of users who submitted an open challenge
   *  [privateSenders] is a map of users who submitted private challenges to
   *    the users they challenged
   *  [privateReceivers] is a map of users to a list of users that sent them
   *    private challenges
   *  [games] is a map from users to a list [opp, game] where [opp] is the
   *    opponent and [game] is a servergame object. Games stores the user's
   *    most recently played game. Users may not take part in more than one game
   *    concurrently.
   *  [listeners] is a list of objects that react to changes to lobby data.
   */
  constructor() {
    this.openChallenges = [];
    this.privateSenders = new Map();
    this.privateReceivers = new MultiMap();
    this.games = new Map();
    this.listeners = [];
  }
  
  /**
   * Adds a listener object to this LobbyData object. [listener] is an object
   * with the functions:
   *  - boardUpdate(list, int, list)
   *  - chatUpdate(list, int, list)
   *  - metaUpdate(list, data)
   *  - gameOver(list, data)
   *  - gameStarted(list, now)
   *  - joined(white, black)
   * The first five functions have the same specifications as the input for
   * ServerGame.addListener(), but with an extra first argument containing
   * the list of users to notify.
   * 
   * [joined] notifies the listener that two players with usernames [white] and 
   * [black] have joined a game with each other.
   */
  addListener(listener) {
    this.listeners.push(listener);
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
   * Helper function for setting up ServerGame listener
   */
  makeGameListener(users) {
    let boardUpdate = (i, l) => {
      for(let listener of this.listeners) {
        listener.boardUpdate(users, i, l);
      }
    };
    let chatUpdate = (i, l) => {
      for(let listener of this.listeners) {
        listener.chatUpdate(users, i, l);
      }
    };
    let metaUpdate = (data) => {
      for(let listener of this.listeners) {
        listener.metaUpdate(users, data);
      }
    };
    let gameOver = (data) => {
      for(let listener of this.listeners) {
        listener.gameOver(users, data);
      }
    };
    let gameStarted = (now) => {
      for(let listener of this.listeners) {
        listener.gameStarted(users, now);
      }
    };
    return {
      boardUpdate: boardUpdate,
      chatUpdate: chatUpdate,
      metaUpdate: metaUpdate,
      gameOver: gameOver,
      gameStarted: gameStarted,
    };
  }

  /**
   * Attempts to start a game with [user] accepting the challenge issued by
   * [sender]. This can fail if:
   *  - If [sender] did not send a challenge that can be accepted by
   *    [user].
   *  - If either [sender] or [user] are in a game.
   */
  attemptJoin(user, sender) {
    if(this.isInGame(user)) return;
    if(this.isInGame(sender)) return;
    if(this.privateSenders.get(sender) === user
      || this.openChallenges.indexOf(sender) !== -1) {
      this.cancelChallenge(user);
      this.cancelChallenge(sender);
      let gamedata = (Math.random() < 0.5) ? new ServerGame(sender, user) :
        new ServerGame(user, sender);
      this.games.set(user, [sender, gamedata]);
      this.games.set(sender, [user, gamedata]);
      gamedata.addListener(this.makeGameListener([user, sender]));
      for(let listener of this.listeners) {
        listener.joined(gamedata.white, gamedata.black);
      }
    }
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
