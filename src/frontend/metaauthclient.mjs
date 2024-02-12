import io from "socket.io-client";
import {LagEstimator} from "../data/lag_estimator.mjs";
/**
 * Wrapper class around socket.io, client side, to provide login and clock delay
 * estimation functionality. Intended to be used with class MetaAuthServer.
 * 
 * Client classes should not use the constructor directly and instead use
 * the [connect] function provided below to construct new instances.
 */
class MetaAuthClient {
  constructor(socket, username) {
    this.socket = socket;
    this.user = username;
    this.lagEstimator = new LagEstimator();
  }
  /**
   * Adds an event handler to this client-side socket. [eventName] is the name
   * of the event, and [func] is the handler function. [func] takes two
   * arguments, [meta] and [args].
   * 
   * [meta] is an object containing metadata information. Its properties are:
   *   [lagMin]: lower bound estimated local minus server Date.now()
   *   [lagMax]: upper bound estimated local minus server Date.now()
   */
  addEventHandler(eventName, func) {
    this.socket.on(eventName, (args) => {
      let meta = {
        lagMin: this.lagEstimator.get_min(),
        lagMax: this.lagEstimator.get_max(),
      };
      func(meta, args);
    });
  }
  /**
   * Sends a request to the server, named [eventName], with arguments [args],
   * and callback [ack]. [args] depends on the specific request. [ack] should
   * take two arguments, [meta] and [ack_args]. [meta] contains the properties:
   *   [clientSendTime]
   *   [serverReceiveTime]
   *   [serverSendTime]
   *   [clientReceiveTime]
   *   [user]
   *   [isGuest]
   *   [lagMin]
   *   [lagMax]
   */
  notify(eventName, args, ack) {
    let meta = {
      clientSendTime: Date.now()
    };
    this.socket.emit(eventName, meta, args, (meta, args) => {
      meta.clientReceiveTime = Date.now();
      this.lagEstimator.record(meta);
      meta.lagMin = this.lagEstimator.get_min();
      meta.lagMax = this.lagEstimator.get_max();
      ack(meta, args);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

/**
 * Attempts to log in to [url], with login type [type]. [type] is an object
 * of type [LoginType]. 
 * 
 * If [type] is [LoginType.GUEST], then [password] can be anything. If 
 * [username] is specified, and is a valid guest username, then that username 
 * will be assigned.
 * 
 * [success] is a callback function taking
 * the resultant MetaAuthClient connector as an argument, if the login was
 * successful; otherwise, [failure] is called instead, using the error essage
 * as the argument.
 */
function connect(url, username, password, type, target, success, failure) {
  let socket = io(url, {transports:["websocket"]});
  let timeMeta = {
    clientSendTime: Date.now(),
  };
  socket.emit("login", username, password, type, target, (result, msg, times) => {
    if(result) {
      timeMeta.clientReceiveTime = Date.now();
      let output = new MetaAuthClient(socket, msg);
      Object.assign(timeMeta, times);
      output.lagEstimator.record(timeMeta);
      success(output);
    }
    else failure(msg);
  });
}

export {connect};
