<h1>Welcome to Chess Royale!</h1>

<p>
  This project is a web implementation of a game that I created, where the turn-
  based system of chess is replaced with the elixir system of Clash Royale. By
  eliminating the turn system, I eliminate the two least fun aspects of chess: 
  waiting for the opponent to move and white receiving an unfair advantage
  getting the first move. For a full set of rules, see royalechess.org/howto.
</p>
<p>
  This project is available for play at royalechess.org, however, this project
  and its multi-player functionality is no longer maintained. To play this game
  with your friends, follow the instructions below for running your own server.
</p>

<h2>Setting up your own Chess Royale server</h2>
<p>To set up this project on your own server for multiplayer, follow these steps</p>
<ol>
  <li>
    Install npm version 10 and node version 20 (nvm, node version manager, 
    is recommended)
  </li>
  <li>
    Run "npm install" to install dependencies.
  </li>
  <li>
    Edit OFFLINE to false in src/frontend/config.js; edit URL to the public IP
    address of your server.
  </li>
  <li>
    Run "make build" to compile and build all pages
  </li>
  <li>
    On your server, cd into src/backend and run "node index.mjs". Personally,
    I found that using bun (bun.sh) to run the backend worked better, but
    node should work just fine.
  </li>
  <li>
    Now load the webpage from your server and have fun!
  </li>
</ol>

