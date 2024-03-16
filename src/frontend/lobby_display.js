import "./index.css";
import "./popup.css";
import {Tabs} from "./tabs.js";
import {HeaderRow} from "./header.js";
import {renderPopUp} from "./popup.js";
import {URL, LoginType} from "../data/enums.mjs";

const RowType = {
  NO_CHALLENGES: "empty",
  OUTGOING_PUBLIC: "outgoing_public",
  OUTGOING_PRIVATE: "outgoing_private",
  INCOMING_PUBLIC: "incoming_public",
  INCOMING_PRIVATE: "incoming_private",
  LOADING: "loading",
  PRACTICE: "practice",
  NO_ONGOING: 0,
}

function getDescription(props) {
  switch(props.type) {
    case RowType.OUTGOING_PRIVATE: return "Challenging " + props.opponent;
    case RowType.OUTGOING_PUBLIC: return "Outgoing challenge";
    case RowType.INCOMING_PRIVATE: return "Private Challenge";
    case RowType.INCOMING_PUBLIC: return "Public Challenge";
    case RowType.PRACTICE: return "Practice vs Bot";
    default: throw new Error("Incomplete case match: " + props.type);
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
    default: throw new Error("Incomplete case match: " + props.type);
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
  if(props.type === RowType.NO_ONGOING) {
    return <div className={"roomli empty"}>
      <div className={"floater"}>{"<No ongoing games>"}</div>
    </div>
  }
  if(props.type === RowType.LOADING) {
    return <div className={"roomli empty"}>
      <div className={"floater"}>{"Loading ..."}</div>
    </div>;
  }
  let challengerDescription = props.challenger;
  if(props.challengerElo) challengerDescription += " (" + props.challengerElo + ")";
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

function goSpectate(user) {
  window.location.replace(URL + "/spectate?user=" + user);
}

/** 
 * Renders a single row in the spectate lobby. Props is required to have props:
 *   - white (string): username of the player playing white
 *   - black (string): username of the player playing black
 *   - whiteElo (int or empty string): elo of the player playing white, or empty
 *     string if they're a guest
 *   - blackElo (int or empty string): elo of the player playing black, or empty
 *     string if they're a guest
 */
function SpectateRow(props) {
  let whiteDescription = props.white;
  if(props.whiteElo) whiteDescription += " (" + props.whiteElo + ")";
  let blackDescription = props.black;
  if(props.blackElo) blackDescription += " (" + props.blackElo + ")";
  return <div className={"roomli"}>
    <div className={"descriptor_left"}>
      <div className={"spectate_white"}></div>
      <div className={"descriptor_user_left"}
        onClick={() => goSpectate(props.white)}>{whiteDescription}</div>
      <div className={"action_white"}>Watch as white</div>
    </div>
    <div className={"descriptor_right"}>
      <div className="spectate_black"></div>
      <div className="descriptor_user_right"
        onClick={() => goSpectate(props.black)}>{blackDescription}</div>
      <div className={"action_black"}>Watch as black</div>
    </div>
    <div className={"versus"}>VS</div>
  </div>
}

function practiceLobby(props) {
  if(!props.data) return <LobbyRow type={RowType.LOADING} />;
  let output = [
    <LobbyRow
      key={"practice1"}
      challenger={"PracticeBotLV1"}
      challengerElo={200}
      type={RowType.PRACTICE}
      opponent={undefined}
      onClick={() => {window.location.replace(URL + "/target_dummy")}}
    />,
    <LobbyRow
      key={"practice2"}
      challenger={"PracticeBotLV2"}
      challengerElo={500}
      type={RowType.PRACTICE}
      opponent={undefined}
      onClick={() => {window.location.replace(URL + "/angry_chicken")}}
    />,
    <LobbyRow
      key={"practice3"}
      challenger={"PracticeBotLV3"}
      challengerElo={900}
      type={RowType.PRACTICE}
      opponent={undefined}
      onClick={() => {window.location.replace(URL + "/mad_scientist")}}
    />,
  ];
  return output;
}
/**
 * Converts [data] to a list of LobbyRow objects.
 * By convention: outgoing challenges go first, then private incoming challenges
 * then incoming open challenges
 */
function playersLobby(props) {
  let data = props.data;
  if(!data) return [<LobbyRow key={"#loading"} type={RowType.LOADING} />];
  let priority_list = [];
  if(props.loginType === LoginType.LOGIN) {
    for(let {user, elo} of data.outgoing) {
      priority_list.push(<LobbyRow
        key={user + RowType.OUTGOING_PRIVATE}
        challenger={props.user}
        challengerElo={props.userElo}
        type={RowType.OUTGOING_PRIVATE}
        opponent={user}
        onClick={() => props.cancelChallenge()}
      />);
    }
    for(let {user, elo} of data.incoming) {
      priority_list.push(<LobbyRow
        key={user + RowType.INCOMING_PRIVATE}
        challenger={user}
        challengerElo={elo}
        type={RowType.INCOMING_PRIVATE}
        opponent={props.user}
        onClick={() => props.acceptChallenge(user)}
      />);
    }
  }
  let open_list = [];
  for(let {user, elo} of data.open) {
    if(user === props.user) {
      priority_list.push(<LobbyRow
        key={user + RowType.OUTGOING_PUBLIC}
        challenger={props.user}
        challengerElo={props.userElo}
        type={RowType.OUTGOING_PUBLIC}
        opponent={undefined}
        onClick={() => props.cancelChallenge()}
      />);
    } else {
      open_list.push(<LobbyRow
        key={user + RowType.INCOMING_PUBLIC}
        challenger={user}
        challengerElo={elo}
        type={RowType.INCOMING_PUBLIC}
        opponent={undefined}
        onClick={() => props.acceptChallenge(user)}
      />);
    }
  }
  let output = priority_list.concat(open_list);
  if(output.length === 0) {
    return <LobbyRow type={RowType.NO_CHALLENGES} />
  }
  return output;
}

function spectateLobby(props) {
  if(!props.data) return <LobbyRow type={RowType.LOADING} />;
  if(props.data.ongoing.length === 0) {
    return <LobbyRow type={RowType.NO_ONGOING} />
  }
  return props.data.ongoing.map(pair => {
    let white = pair[0];
    let black = pair[1];
    return <SpectateRow
      key={white.user}
      white={white.user}
      black={black.user}
      whiteElo={white.elo}
      blackElo={black.elo}
    />})
}

function PrivateChallengePopUp(props) {
  return <div>
    <h3>Who would you like to challenge?</h3>
    <input className="text_input" type="text" id="opponent-input" />
    <br />
  </div>
}

function handlePrivateChallenge(props) {
  if(props.loginType === LoginType.GUEST) {
    renderPopUp(<h2>Private challenges are for logged in users only</h2>, [{
      inner: "Okay",
      onClick: () => {},
    }]);
    return;
  }
  if(props.loginType !== LoginType.LOGIN) {
    return;
  }
  renderPopUp(<PrivateChallengePopUp />, [{
    inner: "Send challenge!",
    onClick: () => {
      let username = document.querySelector("#opponent-input").value;
      props.createPrivateChallenge(username);
    }
  }, {
    inner: "Cancel",
    onClick: () => {},
  }]);
}

/** 
 * Lobby screen display. Props is required to have props:
 *   - user (string): the user's username.
 *   - userElo (int or string): the user's elo, if logged in, or empty string
 *     if playing as guest.
 *   - loginType: the user's login type.
 *   - data ({open, incoming, outgoing, ongoing} or undefined): an object 
 *     containing lobby data to be displayed, or undefined if no data is 
 *     available
 *   - createOpenChallenge () => (None): a function to be called when
 *     user attempts to create an open challenge
 *   - createPrivateChallenge (str) => (None): a function to be called when
 *     the user attempts to create a private challenge, where the input is
 *     the username of the opponent
 *   - cancelChallenge () => (None): a function to be called when the user
 *     attempts to cancel any outgoing challenges
 *   - acceptChallenge (string) => (None): a function to be called when the
 *     user attempts to accept another user's challenge. The input is the
 *     opponent's username
 */
function LobbyDisplay(props) {
  let labels = ["Play", "Practice"];
  let windows = [
    <div>{playersLobby(props)}</div>,
    <div>{practiceLobby(props)}</div>,
  ];
  if(props.loginType === LoginType.LOGIN) {
    labels.push("Spectate");
    windows.push(<div>{spectateLobby(props)}</div>);
  }
  return <div>
    <HeaderRow username={props.user} loginType={props.loginType} />
    <div className={"main_display"}>
      <Tabs labels={labels} windows={windows} />
    </div>
    <div className={"button_row"}>
      <button className={"optionbutton"} onClick={props.createOpenChallenge}>
        Create open challenge
      </button>
      <button className={"optionbutton"} 
        onClick={() => {handlePrivateChallenge(props)}}>
        Create private challenge
      </button>
      <button className={"optionbutton"}
        onClick={() => {window.location.replace(URL + "/howto")}}>
        How to play
      </button>
    </div>
  </div>
}

//let data = {
//  open: [{user: "BOT_RANDY", elo: 1200}],
//  incoming: [{user: "tiny25", elo: 1000}],
//  outgoing: [{user: "Arturo", elo: 9999}],
//  ongoing: [[{user: "nicecream18", elo: 1100}, {user: "slimkey", elo: 1200}]],
//};
//
//const root = ReactDOM.createRoot(document.getElementById("root"));
//root.render(<LobbyDisplay 
//  user={"ralphwx"}
//  userElo={"1100"}
//  data={data}
//  createOpenChallenge={() => {console.log("create open")}}
//  createPrivateChallenge={(username) => {console.log("private challenge: " + username)}}
//  cancelChallenge={() => {console.log("cancel challenge")}}
//  acceptChallenge={(username) => {console.log("accept challenge from " + username)}}
///>);

export {LobbyDisplay};
