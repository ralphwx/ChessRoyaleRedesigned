import React from "react";
import logo1 from "./img/logo1.png";
import logo2 from "./img/logo2.png";
import {URL, LoginType} from "../data/enums.mjs";
import {DynamicDisplay} from "./dynamicdisplay.js";
import "./header.css";

function logout() {
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  window.location.replace(URL + "/login");
}

function loginTypeToString(username, loginType) {
  if(loginType === undefined) return "";
  switch(loginType) {
    case undefined:
    case LoginType.CREATE: return "";
    case LoginType.LOGIN: return "Logged in as " + username;
    case LoginType.GUEST: return "Playing as " + username;
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
  let userbox_message = loginTypeToString(props.username, props.loginType);
  let userbox = <div></div>;
  if(userbox_message.length > 0) {
    userbox = <div>
      {userbox_message}
      <br/>
      <button id="logout" onClick={() => logout()}>Log out</button>
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
