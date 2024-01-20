
/**
 * Main backend script for chess royale. Connecting clients should implement
 * endpoints for the following server to client requests:
 * 
 * [joined] (no args): notifies the client that they have been matched in a game
 *   and should redirect to a game screen.
 * [boardUpdate] (i, moves): notifies the client of new moves that have been
 *   added to the game that they are taking part in. [i] and [moves] have the
 *   same specifications as the input to listeners attached to GameData objects.
 * [chatUpdate] (i, messages): notifies the client of new chat messages.
 *   [i] and [messages] have the same specifications as the input to listeners
 *   attached to ChatLog objects.
 * [metaUpdate] (data): notifies the client of metadata changes in their game.
 *   [data] is an object containing attributes [white], [black], [wdraw],
 *   [wready], and so on.
 * [gameOver] (data): notifies the client that the game they are taking part
 *   in has ended. [data] is an object containing [gameOverCause] and 
 *   [gameOverResult] attributes.
 * [gameStarted] (now): notifies the client that their game started at local
 *   time [now].
 *
 */
import {createServer} from "http";
const server = createServer();

import {MetaAuthServer} from "./metaauthserver.mjs";
import {LobbyData} from "./lobbydata.mjs";
import {UserManager} from "./users.mjs";

let users = new UserManager("./users/");
let authserver = new MetaAuthServer(server, users);

let guestlobby = new LobbyData();
let userslobby = new LobbyData();

/**
 * Set up lobby listeners that notify the client upon changes.
 */
let handleBoardUpdate = (users_list, i, l) => {
  for(let user of users_list) {
    authserver.notify(user, "boardUpdate", {i: i, moves: l})
  }
};

let handleChatUpdate = (users_list, i, l) => {
  for(let user of users_list) {
    authserver.notify(user, "chatUpdate", {i: i, messages: l});
  }
};

let handleMetaUpdate = (users_list, data) => {
  for(let user of users_list) {
    authserver.notify(user, "metaUpdate", {data: data});
  }
};

let handleGameOver = (users_list, data) => {
  for(let user of users_list) {
    authserver.notify(user, "gameOver", {data: data});
  }
};

let handleGameStart = (users_list, now) => {
  for(let user of users_list) {
    authserver.notify(user, "gameStarted", {now: now});
  }
};

let handleJoined = (white, black) => {
  authserver.notify(white, "joined");
  authserver.notify(black, "joined");
}

let listener = {
  boardUpdate: handleBoardUpdate,
  chatUpdate: handleChatUpdate,
  metaUpdate: handleMetaUpdate,
  gameOver: handleGameOver,
  gameStarted: handleGameStart,
  joined: handleJoined,
};
guestlobby.addListener(listener);
userslobby.addListener(listener);

/**
 * The remainder of the code implements server responses to client requests
 */

/**
 * Redirect? request is used by the client to determine if they need to redirect
 * to a different screen. [args] is not used. [ack] returns a Location object
 * specifying where the client should redirect to.
 */
authserver.addEventHandler("redirect?", (meta, args, ack) => {
  let game = meta.isGuest ? guestlobby.getGame(meta.user) 
    : userslobby.getGame(meta.user);
  if(!game || game.gameOver) {
    ack(Location.LOBBY);
  } else {
    ack(Location.GAME);
  }
});

/**
 * Returns a user's profile info. [args] be an object with a propert [user].
 * Currently, [ack] returns an object with the property [elo], but more
 * properties may be added later. If the user does not exist, then an empty
 * object is returned.
 */
authserver.addEventHandler("getUserInfo", (meta, args, ack) => {
  if(users.userExists(args.user)) {
    ack({elo: users.getElo(args.user)});
  } else {
    ack({});
  }
});

/**
 * Attempts to create an open challenge. [args] is not used. [ack] returns
 * nothing.
 */
authserver.addEventHandler("createOpenChallenge", (meta, args, ack) => {
  if(meta.isGuest) {
    guestlobby.makeOpenChallenge(meta.user);
  } else {
    userslobby.makeOpenChallenge(meta.user);
  }
  ack();
});

/**
 * Attempts to create a private challenge. [args] is the string username of the
 * player to challenge. [ack] returns an object with two properties:
 *   [result]: true if the challenge was successfully created, false otherwise
 *   [message]: An error message if challenge creation was unsuccessful.
 */
authserver.addEventHandler("createPrivateChallenge", (meta, args, ack) => {
  if(meta.isGuest) {
    ack({
      result: false,
      message: "Guest users may not send private challenges",
    });
  } else if(!users.userExists(args)) {
    ack({
      result: false,
      message: "User " + args + " does not exist",
    });
  } else if(userslobby.isInGame(meta.user)) {
    ack({
      result: false,
      message: "Cannot create a challenge while playing a game",
    });
  } else {
    userslobby.makePrivateChallenge(meta.user, args);
    ack({
      result: true,
    });
  }
});

/**
 * Attempts to accept a challenge from another user. [args] is the username of
 * the other user. [ack] returns nothing. If successful, the two players will be
 * matched up in a game and both players are notified. Otherwise, nothing 
 * happens.
 */
authserver.addEventHandler("acceptChallenge", (meta, args, ack) => {
  if(meta.isGuest) {
    guestlobby.attemptJoin(meta.user, args);
  } else {
    userslobby.attemptJoin(meta.user, args);
  }
  ack();
});

/**
 * Handles a request to cancel outgoing challenges. [args] is not used. [ack]
 * returns nothing.
 */
authserver.addEventHandler("cancelChallenge", (meta, args, ack) => {
  if(meta.isGuest) guestlobby.cancelChallenge(meta.user);
  else userslobby.cancelChallenge(meta.user);
  ack();
});

/**
 * Handles a request for lobbyData. [args] is not used. [ack] returns an object
 * containing the properties:
 *   [open]: a list of users who submitted open challenges
 *   [incoming]: a list of users who submitted private challenges to the user
 *   [outgoing]: a list of users to whom the user submitted a private challenge
 */
authserver.addEventHandler("lobbyData", (meta, args, ack) => {
  let lobby;
  if(meta.isGuest) lobby = guestlobby;
  else lobby = userslobby;
  let open = lobby.publicChallenges();
  let incoming = lobby.privateChallenges();
  let outgoing = lobby.outgoingChallenges();
  ack({
    open: open,
    incoming: incoming,
    outgoing: outgoing,
  });
});

authserver.addEventHandler("declareReady");
authserver.addEventHandler("move");
authserver.addEventHandler("message");
authserver.addEventHandler("getMetaData");
authserver.addEventHandler("getGameData");
authserver.addEventHandler("offerDraw");
authserver.addEventHandler("resign");

/**
 * Handles a request to abort the game. [args] is not used and [ack] returns
 * nothing. If the user is in a game but the game has not yet started, this
 * request aborts the game, otherwise, it does nothing.
 */
authserver.addEventHandler("abort", (meta, args, ack) => {
  let lobby = meta.isGuest ? guestlobby : userslobby;
  if(lobby.isInGame(meta.user)) {
    lobby.getGame(meta.user).abort();
  }
  ack();
});

server.listen(8080, () => {
  console.log("listening on *:8080");
});
