import React from "react";
import logo1 from "./img/logo1.png";
import logo2 from "./img/logo2.png";
import {URL} from "../data/enums.mjs";
import {DynamicDisplay} from "./dynamicdisplay.js";
import "./header.css";

/**
 * HeaderRow renders the top row of the screen, containing the logo and some
 * text displaying the user's username.
 */
function HeaderRow(props) {
  function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    window.location.replace(URL + "/login");
  }
  let username = JSON.parse(localStorage.getItem("username"));
  let userbox = <div></div>;
  if(username !== null) {
    userbox = <div>
      Logged in as {username}
      <br/>
      <button id="logout" onClick={() => logout()}>Log out</button>
    </div>
  }
  return <div id="header_row">
    <div className="userwrapper">{userbox}</div>
    <div className="logowrapper">
      <DynamicDisplay
        innerHTMLHorizontal={<img src={logo2} id="logo" alt="?"/>}
        innerHTMLVertical={<img src={logo1} id="logo" alt="?"/>}
        ratio={0.8}
      />
    </div>
  </div>
}

export {HeaderRow};
