
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
 * the other user. [ack] returns nothing.
 */
authserver.addEventHandler("acceptChallenge", (meta, args, ack) => {
  let result;
  if(meta.isGuest) {
    result = guestlobby.attemptJoin(meta.user, args);
  } else {
    result = userslobby.attemptJoin(meta.user, args);
  }
  if(result) {
    authserver.notify(meta.user, "joined");
    authserver.notify(args, "joined");
  }
});

authserver.addEventHandler("cancelChallenge");
authserver.addEventHandler("lobbyData");
authserver.addEventHandler("declareReady");
authserver.addEventHandler("move");
authserver.addEventHandler("message");
authserver.addEventHandler("getMetaData");
authserver.addEventHandler("getGameData");
authserver.addEventHandler("offerDraw");
authserver.addEventHandler("resign");
authserver.addEventHandler("abort");

server.listen(8080, () => {
  console.log("listening on *:8080");
});
