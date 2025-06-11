import React from "react";
import ReactDOM from "react-dom/client";
import {connect} from "./metaauthclient.mjs";
import {URL, LoginType, Location} from "../data/enums.mjs";
import {renderPopUp} from "./popup.js";
import {LobbyDisplay} from "./lobby_display.js";
import "./lobby.css";
import {OFFLINE} from "./config.js";

let username = window.localStorage.getItem("username");
let password = window.localStorage.getItem("password");
let loginType = JSON.parse(window.localStorage.getItem("loginType"));
if(OFFLINE) loginType = LoginType.GUEST;

function handleCreateOpenChallenge(socket) {
  if(socket === undefined) return;
  socket.notify("createOpenChallenge", {}, (meta, args) => {});
}

function handleCreatePrivateChallenge(socket, opponent) {
  if(socket === undefined) return;
  socket.notify("createPrivateChallenge", opponent, (meta, args) => {
    if(!args.result) {
      renderPopUp(<h3>{args.message}</h3>, [{inner:"Okay", onClick:() => {}}]);
    }
  });
}

function handleCancelChallenge(socket) {
  if(socket === undefined) return;
  socket.notify("cancelChallenge", {}, (meta, args) => {});
}

function handleAcceptChallenge(socket, opponent) {
  if(socket === undefined) return;
  socket.notify("acceptChallenge", opponent, () => {});
}

class Lobby extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
    this.state = {
      user: props.user,
      userElo: undefined,
      data: undefined,
    }
    this.loginType = loginType;
    if(this.socket) {
      this.socket.notify("getUserInfo", {user: this.state.user}, (meta, args) => {
        this.setState({userElo: args.elo});
      });
      setInterval(() => {
        this.socket.notify("lobbyData", {}, (meta, args) => {
          this.setState({data: args});
        });
      }, 1000);
    }
  }
  render() {
    return <LobbyDisplay 
      user={this.state.user} 
      userElo={this.state.userElo}
      data={this.state.data}
      loginType={this.loginType}
      createOpenChallenge={() => handleCreateOpenChallenge(this.socket)}
      createPrivateChallenge={(opponent) => 
        handleCreatePrivateChallenge(this.socket, opponent)}
      cancelChallenge={() => handleCancelChallenge(this.socket)}
      acceptChallenge={(opponent) => handleAcceptChallenge(this.socket, opponent)}
    />
  }
}

function LoginPopUp(props) {
  return <div>
    <h2>Welcome to Chess Royale! Please log in or select 'Play as Guest'</h2>
    <div>
      <form onSubmit={handleLogin}>
        <div>
          <div className="entry">
            <label>Username:</label>
            <input className="text_input" type="text" id="username-input"/>
            <br />
          </div>
          <div className="entry">
            <label>Password:</label>
            <input className="text_input" type="password" id="password-input"/>
            <br />
          </div>
        </div>
      </form>
    </div>
  </div>
}

function SunsetPopUp(props) {
    return <div>
        <h2>Welcome to Chess Royale!</h2>
        <p>
            Due to a lack of interest in this game, I've decided to sunset all
            multiplayer functionality (and stop paying for the server). You can
            still play against the practice bots that I designed on this website
            under "Practice". The code for this game is also publicly available
            on GitHub, so feel free to clone and host your own server to play
            with your friends!
        </p>
    </div>
}

function handleLogin() {
  let username = document.querySelector("#username-input").value;
  let password = document.querySelector("#password-input").value;
  connect(URL, username, password, LoginType.LOGIN, undefined, (socket) => {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    localStorage.setItem("loginType", JSON.stringify(LoginType.LOGIN));
    window.location.reload(true);
  }, (msg) => {
    renderPopUp(<h2>{msg}</h2>, [{
      inner: "Okay", 
      onClick: requestAuthentication,
      preventDefault: true,
    }]);
  });
}

function handleCreate() {
  window.location.replace(URL + "/create");
}

function handleGuest() {
  connect(URL, undefined, undefined, LoginType.GUEST, undefined, (socket) => {
    localStorage.setItem("username", socket.user);
    localStorage.setItem("password", undefined);
    localStorage.setItem("loginType", JSON.stringify(LoginType.GUEST));
    window.location.reload(true);
  }, (msg) => {
    renderPopUp(<h2>{msg}</h2> [{inner: "Okay",
      onClick: () => window.location.reload(true)}]);
  });
}

function requestAuthentication() {
  root.render(<Lobby user={""} socket={undefined} />);
  renderPopUp(<LoginPopUp />, [
    {
      inner: "Log in",
      onClick: handleLogin,
    },
    {
      inner: "Create account",
      onClick: handleCreate,
    },
    {
      inner: "Play as Guest",
      onClick: handleGuest,
    },
  ]);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
if(OFFLINE) {
  renderPopUp(<SunsetPopUp />, [
    {
      inner: "Okay",
      onClick: () => {},
    }
  ]);
  root.render(<Lobby user={""} socket={undefined} />);
} else {
  if(loginType !== null) {
    connect(URL, username, password, loginType, undefined, (socket) => {
      socket.addEventHandler("joined", (meta, args) => {
        window.location.replace(URL + "/game");
      });
      socket.addEventHandler("started", (meta, args) => {
        window.location.replace(URL + "/game");
      });
      socket.notify("redirect?", {}, (meta, args) => {
        if(args === Location.GAME) {
          window.location.replace(URL + "/game");
        }
      });
      root.render(<Lobby user={username} loginType={loginType} socket={socket} />);
    }, (msg) => {
      requestAuthentication();
    });
  } else {
    requestAuthentication();
  }
}

