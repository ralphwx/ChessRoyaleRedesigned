import React from "react";
import logo1 from "./img/logo1.png";
import logo2 from "./img/logo2.png";
import {URL, LoginType} from "../data/enums.mjs";
import {DynamicDisplay} from "./dynamicdisplay.js";
import "./header.css";

function logout() {
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  localStorage.removeItem("loginType");
  window.location.replace(URL);
}

function loginTypeToString(username, loginType) {
  if(!loginType) return "";
  switch(loginType) {
    case undefined:
    case LoginType.CREATE: return "";
    case LoginType.LOGIN: return "Logged in as " + username;
    case LoginType.GUEST: return "Playing as " + username;
    case LoginType.SPECTATE: return "Spectating as " + username;
    case LoginType.REPLAY: return "REPLAY";
    default: throw new Error("Incomplete case match");
  }
}

/**
 * HeaderRow renders the top row of the screen, containing the logo and some
 * text displaying the user's username. Require props to have the properties:
 *   [username]: the string username to be displayed
 *   [loginType]: a LoginType object describing the user's state, or undefined
 *     if the user is not logged in.
 */
function HeaderRow(props) {
  if(props.loginType === LoginType.REPLAY) {
    return <div id="header_row">
      <div className="userwrapper">
        <div>
          Watching REPLAY
          <br />
          <button id="logout" onClick={() => {window.location.replace(URL)}}>
            {"Exit"}
          </button>
        </div>
      </div>
      <div className="logowrapper">
        <a href={URL}>
          <DynamicDisplay
            innerHTMLHorizontal={<img src={logo2} id="logo" alt="?"/>}
            innerHTMLVertical={<img src={logo1} id="logo" alt="?"/>}
            ratio={0.8}
          />
        </a>
      </div>
    </div>
  }
  let userbox_message = loginTypeToString(props.username, props.loginType);
  let userbox = <div></div>;
  let logout_message = "Log in/Register";
  if(props.loginType === LoginType.LOGIN) logout_message = "Log out";
  if(userbox_message.length > 0) {
    userbox = <div>
      {userbox_message}
      <br/>
      <button id="logout" onClick={() => logout()}>{logout_message}</button>
    </div>
  }
  return <div id="header_row">
    <div className="userwrapper">{userbox}</div>
    <div className="logowrapper">
      <a href={URL}>
        <DynamicDisplay
          innerHTMLHorizontal={<img src={logo2} id="logo" alt="?"/>}
          innerHTMLVertical={<img src={logo1} id="logo" alt="?"/>}
          ratio={0.8}
        />
      </a>
    </div>
  </div>
}

export {HeaderRow};
