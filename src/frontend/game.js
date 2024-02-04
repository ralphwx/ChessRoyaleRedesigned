
import React from "react";
import ReactDOM from "react-dom/client";
import {Controller} from "./frontend/controller3.mjs";
import {GameModel} from "./frontend/game_model.mjs";
import {connect} from "./frontend/metaauthclient.mjs";
import {URL, LoginType} from "./data/enums.mjs";
import {GameDesktop} from "./frontend/game_desktop.js";
import {renderPopUp} from "./frontend/popup.js";

//let user = JSON.parse(localStorage.getItem("username"));
//let psw = JSON.parse(localStorage.getItem("password"));
//let loginType = JSON.parse(localStorage.getItem("loginType"));

let user = "devralph1";
let psw = "password";
let loginType = LoginType.LOGIN;

if(loginType === undefined) {
  //redirect
}

if(loginType === LoginType.GUEST) {
  throw new Error("Unimplemented");
}

//assert loginType === LoginType.LOGIN

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {...props};
    let refreshView = () => {
      let state = props.controller.getViewState();
      this.setState(state);
    };
    
    props.controller.addListener({
      boardUpdated: refreshView,
      chatUpdated: refreshView,
      metaUpdated: refreshView,
      gameStarted: refreshView,
      gameOver: () => {
        refreshView();
        setTimeout(() => {
          renderPopUp(<div>Game over</div>, 
          [{inner: "Okay", onClick:() => {}}]);
        }, 500);
      }
    });
    setInterval(() => {this.setState({});}, 100);
  }
  forceRerender(state) {
    this.setState(state);
  }
  render() {
    return <GameDesktop {...this.state} />
  }
}

connect(URL, user, psw, LoginType.LOGIN, (socket) => {
  socket.notify("redirect?", {}, (meta, args) => {
    if(args !== Location.GAME) {
      //redirect
    }
  });
  let user = socket.user;
  let model = new GameModel(user, socket);
  model.refreshGameData();
  model.refreshMetaData();
  model.refreshChat();
  let controller = new Controller(model);
  let view = <Game {...controller.getViewState()} controller={controller} />
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(view);
}, (msg) => {
  //redirect
});
