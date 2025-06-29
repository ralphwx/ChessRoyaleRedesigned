
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

import {initializeHttp, initializeHttps} from "./bootstrap.mjs";
import {MetaAuthServer} from "./metaauthserver.mjs";
import {LobbyData} from "./lobbydata.mjs";
import {UserManager} from "./users.mjs";
import {Location, Color, URL} from "../data/enums.mjs";
import {isGuest} from "./guestid.mjs";
import {GameDatabase} from "./game_database.mjs";
import {encodeGameData, decodeGameData} from "../data/gamedataencoder.mjs";

let server = initializeHttp(8080);
let users = new UserManager("./users/");
let authserver = new MetaAuthServer(server, users);

let guestlobby = new LobbyData();
let userslobby = new LobbyData();
let games = new GameDatabase("./games/");

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
  if(users.userExists(users_list[0])) {
    let game = userslobby.getGame(users_list[0]);
    if(game.wready && game.bready) {
      let id = games.save(encodeGameData(game.gameState), game.white, game.black, "", "");
      game.chatMessage("[system]", "Replay available at: " + URL 
        + "/replay?id=" + id);
      users.recordGame(game.white, id);
      users.recordGame(game.black, id);
    }
    let welo = users.getElo(game.white);
    let belo = users.getElo(game.black);
    if(data.gameOverResult === Color.WHITE) {
      users.recordWin(game.white, belo);
      users.recordLoss(game.black, welo);
    }
    if(data.gameOverResult === Color.BLACK) {
      users.recordWin(game.black, welo);
      users.recordLoss(game.white, belo);
    }
  } else {
    let game = guestlobby.getGame(users_list[0]);
    if(game.wready && game.bready) {
      let id = games.save(encodeGameData(game.gameState), game.white, game.black, "", "");
      game.chatMessage("[system]", "Replay available at: " + URL 
        + "/replay?id=" + id);
    }
  }
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
 * The saveGame request is used by the client to upload a game to the server.
 * [args] is required to have property [gamedata], which is a string encoding of
 * the game. [args] may also have properties [white] and [black], which specify
 * the usernames of the players. [ack] returns an object with properties {
 *   success (bool): whether the game was saved successfully
 *   id (string): a string id for the saved game
 * }
 */
authserver.addEventHandler("saveGame", (meta, args, ack) => {
  decodeGameData(args.gamedata);
  let id = games.save(args.gamedata, args.white, args.black, "", "");
  ack({
    success: true,
    id: id,
  });
});

/**
 * The loadGame request is used by the client to retrieve data corresponding to
 * a game saved on the server. [args] is the string id of the game to be
 * retrieved. [ack] returns {gamedata, date, white, black, whiteElo, blackElo} if 
 * the game was found (data is a string encoding of the gamedata), returns false
 * otherwise.
 */
authserver.addEventHandler("loadGame", (meta, args, ack) => {
  if(games.gameExists(args)) {
    ack(games.load(args));
  } else {
    ack(false);
  }
});
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
 * Returns a user's profile info. [args] be an object with a property [user].
 * Currently, [ack] returns an object with the properties [elo] and [inGame], 
 * but more
 * properties may be added later. If the user does not exist, then an empty
 * object is returned.
 */
authserver.addEventHandler("getUserInfo", (meta, args, ack) => {
  if(users.userExists(args.user)) {
    ack({elo: users.getElo(args.user), inGame: userslobby.isInGame(args.user)});
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
    guestlobby.makePrivateChallenge(meta.user, args);
    if(guestlobby.outgoingChallenges(args).includes(meta.user)) {
      guestlobby.attemptJoin(meta.user, args);
    }
    ack({
      result: true,
    });
  } else if(!users.userExists(args)) {
    ack({
      result: false,
      message: "User " + args + " does not exist",
    });
  } else if(meta.user === args) {
    ack({
      result: false,
      message: "You may not challenge yourself",
    });
  } else if(userslobby.isInGame(meta.user)) {
    ack({
      result: false,
      message: "Cannot create a challenge while playing a game",
    });
  } else if(userslobby.outgoingChallenges(args).includes(meta.user)) {
    userslobby.makePrivateChallenge(meta.user, args);
    userslobby.attemptJoin(meta.user, args);
    ack({
      result: true,
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
 *   [open]: a list of {user, elo} objects representing users who submitted open
 *     challenges
 *   [incoming]: a list of {user, elo} objects representing users who submitted
 *     private challenges to the user
 *   [outgoing]: a list of {user, elo} objects representing users to whom the 
 *     user submitted a private challenge
 *   [ongoing]: a list of [{user, elo}, {user, elo}] pairs representing ongoing
 *     games.
 * If the request comes from a guest user, the elo's will be set to empty string
 */
authserver.addEventHandler("lobbyData", (meta, args, ack) => {
  let lobby;
  if(meta.isGuest) lobby = guestlobby;
  else lobby = userslobby;
  let open = lobby.publicChallenges().map(x => {
    return {user: x, elo: (meta.isGuest ? "" : users.getElo(x))}
  });
  let incoming = lobby.privateChallenges(meta.user).map(x => {
    return {user: x, elo: (meta.isGuest ? "" : users.getElo(x))}
  });
  let outgoing = lobby.outgoingChallenges(meta.user).map(x => {
    return {user: x, elo: (meta.isGuest ? "" : users.getElo(x))}
  });
  let ongoing_raw = lobby.listOngoing();
  let ongoing = ongoing_raw.map(x => {
    let whiteElo = meta.isGuest ? "" : users.getElo(x[0]);
    let blackElo = meta.isGuest ? "" : users.getElo(x[1]);
    return [{user: x[0], elo: whiteElo}, 
      {user: x[1], elo: blackElo}];
  });
  ack({
    open: open,
    incoming: incoming,
    outgoing: outgoing,
    ongoing: ongoing,
  });
});

/**
 * Handles a request to declare ready in a game. Does nothing if the user is
 * not in a game or if the user has already declared ready. [args] is not used,
 * and [ack] returns nothing.
 */
authserver.addEventHandler("declareReady", (meta, args, ack) => {
  let lobby = meta.isGuest ? guestlobby : userslobby;
  if(lobby.isInGame(meta.user)) {
    lobby.getGame(meta.user).setReady(meta.user);
  }
  ack();
});

/**
 * Handles a request to make a move. Does nothing if the user is not in a game,
 * or if the move is illegal in that game's context for any reason. [args] is
 * required to have properties [iRow], [iCol], [fRow], [fCol]. [ack] returns
 * nothing.
 */
authserver.addEventHandler("move", (meta, args, ack) => {
  let lobby = meta.isGuest ? guestlobby : userslobby;
  if(lobby.isInGame(meta.user)) {
    let game = lobby.getGame(meta.user);
    let color;
    if(game.white === meta.user) color = Color.WHITE;
    else if(game.black === meta.user) color = Color.BLACK;
    else throw new Error("What color are you playing??");
    let move = {
      iRow: args.iRow,
      iCol: args.iCol,
      fRow: args.fRow,
      fCol: args.fCol,
      time: meta.serverReceiveTime,
      color: color,
    };
    game.move(args.iRow, args.iCol, args.fRow, args.fCol, color, 
      meta.serverReceiveTime);
  }
  ack();
});

/**
 * Responds to a request to post a message in the chat in either the current
 * game the user is playing, or in the most recent game the user was playing.
 * If the user has not yet played any games, then nothing is posted.
 *
 * [args] is the string message to be posted. [ack] returns nothing.
 */
authserver.addEventHandler("message", (meta, args, ack) => {
  let lobby = meta.isGuest ? guestlobby : userslobby;
  let game = lobby.getGame(meta.user);
  if(game) {
    game.chatMessage(meta.user, args);
  }
  ack();
});

/**
 * Returns the metadata of either the current game a specified user is playing
 * or of that user's most recent game. If the user has not yet played any games,
 * then empty object is returned.
 *
 * [args] is the string username of the user whose game this request should
 * retrieve, or undefined, if retrieving the user's own game. 
 * [ack] returns an object with the properties [white],
 * [black], [wready], [bready], [wdraw], and [bdraw], each with the same meaning
 * as the input to the metaUpdate function specified for listeners to 
 * [ServerGame].
 */
authserver.addEventHandler("getMetaData", (meta, args, ack) => {
  let user = args ? args : meta.user;
  let lobby = isGuest(user) ? guestlobby : userslobby;
  let game = lobby.getGame(user);
  let output = {};
  if(game) {
    output.white = game.white;
    output.black = game.black;
    output.wready = game.wready;
    output.bready = game.bready;
    output.wdraw = game.wdraw;
    output.bdraw = game.bdraw;
  }
  ack(output);
});

/**
 * Returns the moves of [game], starting from the move at index [i], inclusive.
 * [game] is the current game a specified user is playing, or, if that user is 
 * not currently playing a game, the user's most recently played game. Also 
 * returns the starting time of the game. If the user has not yet played any 
 * games, then empty object is returned. If the user is in a game, but the game
 * has not yet started (ie, one or both players have not yet declared ready), 
 * then moves will be empty list and start time will be undefined.
 *
 * [args] is an object containing properties [i] and [user], where [i] is the
 * start index and [user] is the user whose game this request should retrieve.
 * If [user] is not specified, then the user's own game will be retrieved.
 *
 * [ack] returns an object with properties [startTime] and
 * [moves], where [moves] is the move list and [startTime] is the local time
 * when the game started. All timestamps are expressed in terms of local server
 * time.
 */
authserver.addEventHandler("getGameData", (meta, args, ack) => {
  let user = args.user ? args.user : meta.user;
  let lobby = isGuest(user) ? guestlobby : userslobby;
  let game = lobby.getGame(user);
  if(!game) {
    ack({});
    return;
  }
  if(!game.bothReady()) {
    ack({
      moves: [],
      startTime: undefined,
    });
    return;
  }
  ack({
    moves: game.gameState.movesSince(args.i),
    startTime: game.gameState.startTime,
  });
});

/**
 * Returns the chat log, starting from the [i]th message, of the current game 
 * of a specified user. If that user is not currently playing, the most recent 
 * game that user played is used instead. If the user has not yet played any
 * games, then empty list is returned.
 *
 * [args] is an object with properties [user] and [i]. If [user] is not
 * specified, then meta.user will be used instead. [ack] returns the list of 
 * [sender, message] pairs.
 */
authserver.addEventHandler("getChat", (meta, args, ack) => {
  let user = args.user ? args.user : meta.user;
  let lobby = isGuest(user) ? guestlobby : userslobby;
  let game = lobby.getGame(user);
  if(!game) {
    ack([]);
    return;
  }
  ack(game.chat.getSince(args.i));
  return;
});

/**
 * Handles a request to offer a draw. If the user is not currently in a game,
 * or if the user has already offered a draw, this does nothing.
 *
 * [args] is not used, [ack] returns nothing.
 */
authserver.addEventHandler("offerDraw", (meta, args, ack) => {
  let lobby = meta.isGuest ? guestlobby : userslobby;
  if(lobby.isInGame(meta.user)) {
    lobby.getGame(meta.user).drawOffer(meta.user);
  }
  ack();
});

/**
 * Handles a request to resign the game. If the user is not currently in a
 * game, this does nothing.
 *
 * [args] is not used, [ack] returns nothing.
 */
authserver.addEventHandler("resign", (meta, args, ack) => {
  let lobby = meta.isGuest ? guestlobby : userslobby;
  if(lobby.isInGame(meta.user)) {
    lobby.getGame(meta.user).resign(meta.user);
  }
  ack();
});

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


