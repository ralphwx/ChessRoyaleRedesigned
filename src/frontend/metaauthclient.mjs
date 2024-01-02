import io from "socket.io-client";

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
  }
  /**
   * Adds an event handler to this client-side socket. [eventName] is the name
   * of the event, and [func] is the handler function. [func] takes two
   * arguments, [meta] and [args].
   * 
   * [meta] is an object containing metadata information. Its properties are:
   *   [lagEstimate]: the estimated local Date.now() minus server-side 
   *     Date.now()
   */
  addEventHandler(eventName, func) {
    this.socket.on(eventName, (meta, args) => {
      func(meta, args);
    });
  }
  //send an event to the server. [ack] should take two arguments, an object for
  //metadata and an object for server data
  notify(eventName, args, ack) {
    let meta = {
      clientSendTime: Date.now()
    };
    this.socket.emit(eventName, meta, args, (meta, args) => {
      ack(meta, args);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

function connect(url, username, password, type, success, failure) {
  let socket = io(url, {transports:["websocket"]});
  socket.emit("login", username, password, create, (result, msg) => {
    if(result) success(new MetaAuthClient(socket, msg));
    else failure(msg);
  });
}

export {connect};
