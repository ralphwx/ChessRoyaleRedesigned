
import {UserManager} from "./users.mjs";
import {SocketManager} from "./socketmanager.mjs";
import {Server} from "socket.io";
import {LoginType} from "../data/enums.mjs";
import {generateGuestName} from "./guestid.mjs";

/**
 * MetaAuthServer is a wrapper around socket.io server on the backend. The
 * MetaAuthServer provides metadata and login functionality.
 * 
 * With regards to the [metadata] object: when the client sends the request
 * metadata, it includes properties:
 *   [clientSendTime]: client's Date.now() when the request was sent.
 * When the server sends an acknowledgement back to the client, it adds
 * additional properties:
 *   [serverReceiveTime]: local Date.now() when the request was received.
 *   [serverSendTime]: local Date.now() when the request finished processing.
 *   [user]: user's string ID. This is the username, if logged in, or some
 *     unique identifier string when playing as guest.
 *   [isGuest]: boolean value for whether the user is playing as guest.
 */
class MetaAuthServer {
  /**
   * Constructs a new MetaAuthServer instance from [server]. [server] is an
   * "http" server. [userpath] is a directory where user information is stored.
   */
  constructor(server, userpath) {
    this.io = new Server(server);
    this.eventHandlers = [];
    this.users = new UserManager(userpath);
    this.socketmap = new SocketManager();

    this.io.on("connection", (socket) => {
      let user = null;
      let isGuest = false;
      for(let eventPair of this.eventHandlers) {
        let [name, code] = eventPair
        socket.on(name, (meta, args, ack) => {
          let serverReceiveTime = Date.now();
          if(user === null) return;
          //check for malformed request
          if(!meta || !meta.clientSendTime) {
            this.receivedBadRequest(name, meta, args, "missing metadata");
            return;
          }
          meta.serverReceiveTime = serverReceiveTime;
          meta.user = user;
          meta.isGuest = isGuest;
          try {
            code(meta, args, (data) => {
              meta.serverSendTime = Date.now();
              ack(meta, data);
            });
          } catch(error) {
            this.receivedBadRequest(name, meta, args, error);
          }
        });
      }
      /**
       * Implementation note: "login" is a special request for giving the user
       * a string identifier. [username] and [password] are self-explanatory.
       * [type] is a [LoginType] object representing whether the user wants
       * to log in, create an account, or play as guest. If playing as guest,
       * the [username] and [password] fields are ignored.
       * 
       * [ack] is an acknowledgement function that takes two arguments. The
       * first is a bool for whether the login attempt was successful. If the
       * login was not successful, the second argument is the corresponding
       * error message; otherwise, the second argument is the username assigned
       * to the connecting socket ([username] if creating account or logging in,
       * or some randomly generated guest username if connecting as guest).
       */
      socket.on("login", (username, password, type, ack) => {
        if(user !== null) ack(false);
        if(type === LoginType.CREATE) {
          if(!this.users.validUsername(username)) {
            ack(false, "Usernames may contain only alphanumeric characters and underscores.");
            return;
          }
          if(this.users.userExists(username)) {
            ack(false, "User '" + username + "' already exists. Please select a different username");
            return;
          }
          if(username.length < 4 || username.length > 20) {
            ack(false, "Usernames must be between 4 and 20 characters long. Please select a different username");
            return;
          }
          if(password.length < 8 || password.length > 20) {
            ack(false, "Password must be between 8 and 20 characters long.");
            return;
          }
          this.users.createUser(username, password);
          ack(true, username);
          user = username;
          this.socketmap.add(user, socket);
          return;
        } else if(type === LoginType.LOGIN) {
          if(this.users.authenticate(username, password)) {
            user = username;
            this.socketmap.add(user, socket);
            ack(true, user);
          } else {
            if(!this.users.userExists(username)) {
              ack(false, "User '" + username + "' does not exist");
              return;
            }
            ack(false, "Incorrect password");
          }
        } else {
          user = generateGuestName();
          isGuest = true;
          ack(true, user);
        }
      });
      socket.on("disconnect", () => {
        if(user !== null) this.socketmap.remove(user, socket);
      });
    });
  }
  /**
   * Defines the behavior of this server upon receiving a request named
   * [eventName]. Specifically, when the request is received, [func] will be 
   * called. Require [func] to take three arguments:
   *   [meta]: an object with properties:
   *     [clientSendTime]: client's Date.now() when the client sent the request
   *     [serverReceiveTime]: local Date.now() when the server received the 
   *       request
   *     [user]: a string identifying the client
   *     [isGuest]: a bool representing whether the client is playing as guest.
   *   [args]: an object containing arguments sent by the client. The properties
   *     present depend on the client.
   *   [ack]: an acknowledgement function, taking a single argument [args]. When
   *     the request is completed, [ack] is called to send the result to the
   *     client.
   */
  addEventHandler(eventName, func) {
    this.eventHandlers.push([eventName, func]);
  }
  
  //notifies the user [user] of the event [event] with arguments [data]
  //sends out one notification per socket.
  notify(user, eventName, data) {
    for(let socket of this.socketmap.get(user)) {
      socket.emit(eventName, data);
    }
  }

  //returns whether the user [user] is online. If the user does not exist, then
  //returns false.
  isOnline(user) {
    return this.socketmap.get(user).length > 0;
  }

  /**
   * Records a bad request from the user. [name] is the name of the request,
   * [meta] is the metadata object, [args] is the arguments object, and
   * [reason] is the error message generated.
   */
  receivedBadRequest(name, meta, args, reason) {
    console.log("Received bad request: ");
    console.log("  name: " + name);
    console.log("  metadata: " + JSON.stringify(meta));
    console.log("  arguments: " + JSON.stringify(args));
    console.log("  error message: " + JSON.stringify(reason));
    return;
  }
}

export {MetaAuthServer};
