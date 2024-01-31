
import "./index.css";

/**
 * ChatBox renders a chat window with a text input box. props is required to
 * have properties:
 *   - [messages]: a list of message objects, each with properties [sender] and 
 *     [message].
 *   - [sendMessage]: a function to be called when the user attempts to send
 *     a message.
 */
function ChatBox(props) {
  return <div>
    <div className="console">
      <div style={{margin:"1%"}}>
        {props.messages.map((msg) => {
          return <div>{msg.sender + ": " + msg.message}</div>
        })}
      </div>
    </div>
    <div style={{textAlign: "center"}}>
      <form onSubmit={(e) => {
        e.preventDefault();
        let element = document.querySelector("#chat_input");
        let message = element.value;
        element.value = "";
        props.sendMessage(message);
      }}>
        <input className="chat_input" type="text" id="chat_input" />
      </form>
    </div>
  </div>
}

export {ChatBox}
