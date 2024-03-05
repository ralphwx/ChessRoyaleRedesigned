import React from "react";
import ReactDOM from "react-dom/client";
import "./frontend/index.css";

const RowType = {
  NO_CHALLENGES: "empty",
  OUTGOING_PUBLIC: "outgoing_public",
  OUTGOING_PRIVATE: "outgoing_private",
  INCOMING_PUBLIC: "incoming_public",
  INCOMING_PRIVATE: "incoming_private",
  LOADING: "loading",
  PRACTICE: "practice",
}

function getDescription(props) {
  switch(props.type) {
    case RowType.OUTGOING_PRIVATE: return "Challenging " + props.opponent;
    case RowType.OUTGOING_PUBLIC: return "Outgoing challenge";
    case RowType.INCOMING_PRIVATE: return "Private Challenge";
    case RowType.INCOMING_PUBLIC: return "Public Challenge";
    case RowType.PRACTICE: return "Practice vs Bot";
    default: throw "Incomplete case match: " + props.type;
  }
}

function getFloaterContent(props) {
  switch(props.type) {
    case RowType.OUTGOING_PRIVATE:
    case RowType.OUTGOING_PUBLIC:
      return "Cancel";
    case RowType.INCOMING_PRIVATE:
    case RowType.INCOMING_PUBLIC:
    case RowType.PRACTICE:
      return "Accept";
    default: throw "Incomplete case match: " + props.type;
  }
}

/**
 * Renders a single row in a play lobby. Props is required to have props:
 *   - type (RowType): the type of challenge represented
 *   - challenger (str): the username of the player sending the challenge
 *   - challengerElo (str or int): the elo of the player sending the challenge,
 *     or empty string if guest
 *   - opponent (str or undefined): the username of the player the challenge is
 *     sent to, or undefined if it's a public challenge
 *   - onClick () => (None): function to be called when the user clicks on this
 */
function LobbyRow(props) {
  if(props.type === RowType.NO_CHALLENGES) {
    return <div className={"roomli empty"}>
      <div className={"floater"}>{"<No open challenges>"}</div>
    </div>
  }
  if(props.type === RowType.LOADING) {
    return <div className={"roomli empty"}>
      <div className={"floater"}>{"Loading ..."}</div>
    </div>;
  }
  let challengerDescription = props.challenger;
  if(props.challengerElo) challengerDescription += " " + props.challengerElo;
  let description = getDescription(props);
  let floaterContent = getFloaterContent(props);
  return <div className={"roomli " + props.type + "_border"}
    onClick={() => {props.onClick()}}
  >
    <div className={"descriptor"}>
      <div className={"challenger"}>
        {challengerDescription}
      </div>
      <div className={"subdescription"}>
        {description}
      </div>
    </div>
    <div className={"floater background " + props.type + "_background"}></div>
    <div className={"floater action"}>
      {floaterContent}
    </div>
  </div>
}

/** 
 * Lobby screen display. Props is required to have props:
 *   - data {open, incoming, outgoing, ongoing}: an object containing lobby
 *     data to be displayed
 *   - createOpenChallenge () => (None): a function to be called when
 *     user attempts to create an open challenge
 *   - createPrivateChallenge (str) => (None): a function to be called when
 *     the user attempts to create a private challenge, where the input is
 *     the username of the opponent
 *   - cancelChallenge () => (None): a function to be called when the user
 *     attempts to cancel any outgoing challenges
 */
function LobbyDisplay(props) {
  
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<LobbyRow type={RowType.INCOMING_PUBLIC} challenger={"devralph"}
  challengerElo={""} opponent={undefined} onClick={() => {console.log("click")}} />);
