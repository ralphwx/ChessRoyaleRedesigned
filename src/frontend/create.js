import {HeaderRow} from "./header.js";
import ReactDOM from "react-dom/client";
import {connect} from "./metaauthclient.mjs";
import {LoginType, URL} from "../data/enums.mjs";
import {renderPopUp} from "./popup.js";
import "./index.css";

function handleCreate() {
  let username = document.querySelector("#username-input").value;
  let password = document.querySelector("#password-input").value;
  let password2 = document.querySelector("#password-input2").value;
  if(password !== password2) {
    renderPopUp(<h2>{"Passwords must match"}</h2>, [{inner: "Okay,", 
      onClick: () => window.location.reload(true)}]);
  }
  connect(URL, username, password, LoginType.LOGIN, undefined, (socket) => {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    localStorage.setItem("loginType", JSON.stringify(LoginType.LOGIN));
    window.location.replace(URL);
  }, (msg) => {
    renderPopUp(<h2>{msg}</h2>, [{inner: "Okay",
      onClick: () => window.location.reload(true)}]);
  });
}

function handleGuest() {
  connect(URL, undefined, undefined, LoginType.GUEST, undefined, (socket) => {
    localStorage.setItem("username", socket.user);
    localStorage.setItem("password", undefined);
    localStorage.setItem("loginType", JSON.stringify(LoginType.GUEST));
    window.location.replace(URL);
  }, (msg) => {
    renderPopUp(<h2>{msg}</h2> [{inner: "Okay",
      onClick: () => window.location.reload(true)}]);
  });
}

function handleLogin() {
  window.location.replace(URL + "/login");
}

function Login(props) {
  return <div>
    <HeaderRow user={undefined} loginType={undefined} />
    <div id="loginBox">
      <form onSubmit={handleLogin}>
        <div>
          <div className={"entry"}>
            <label>Username:</label>
            <input className="text_input" type="text" id="username-input"/>
            <br />
          </div>
          <div className="entry">
            <label>Password:</label>
            <input className="text_input" type="password" id="password-input" />
            <br />
          </div>
          <div className="entry">
            <label>Password again: </label>
            <input className="text_input" type="password" id="password-input2" />
            <br />
          </div>
        </div>
      </form>
      <div className="button_input_row">
        <button className="button_input" onClick={handleCreate}>
          Create Account 
        </button>
        <button className="button_input" onClick={handleGuest}>
          Play as Guest
        </button>
        <button className="button_input" onClick={handleLogin}>
          Log In
        </button>
      </div>
    </div>
  </div>
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Login />);
