
import {HTList} from "./htlist.mjs"

/**
 * Records chat history, equipped with functionality for sending updates to
 * listeners.
 */
class ChatLog {
  constructor() {
    this.history = new HTList.NIL;
    this.listeners = [];
  }

  /**
   * Adds a listener [func] to this ChatLog object. [func] is a function that
   * takes two arguments: [i] and [l], where [i] is the starting point of the
   * ChatLog being updated and [l] is a list of Message objects. Each Message
   * object contains two properties, [sender] and [message].
   */
  addListener(func) {
    this.listeners.push(func);
  }

  /**
   * Adds a message [message] from sender [sender] into the chat history.
   */
  addMessage(sender, message) {
    let i = this.history.length;
    let message_obj = {sender: sender, message: message};
    this.history = HTList.cons(message_obj, this.history);
    for(let l of this.listeners) {
      l(i, [message_obj]);
    }
  }
  /**
   * Compiles a list of all messages, starting from the [i]th message. Indexing
   * starts from zero.
   * If [i] exceeds the length of this.history, then empty list is returned;
   * if [i] is negative, it's treated as 0.
   */
  getSince(i) {
    let h = this.history;
    let output = [];
    while(!h.isNil() && h.length > i) {
      output.push(h.head);
      h = h.tail;
    }
    return output.reverse();
  }
}
