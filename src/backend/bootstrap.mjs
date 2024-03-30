
import {readFileSync} from "fs";
import express from "express";
import {createServer} from "https";
import {createServer as createHttp} from "http";

/**
 * Initializes this backend as an http server listening on port [port]. The
 * resultant [server] object is returned.
 */
function initializeHttp(port) {
  let app = express();
  let server = createServer(app);
  app.use(express.static("../../main"));
  server.listen(port, () => {
    console.log("listening on *:" + port);
  });
  return server;
}

/**
 * Initializes this backend as an https server. The resultant server object is
 * returned.
 */
function initializeHttps() {
  let app = express();
  let privateKey = readFileSync("/etc/letsencrypt/live/royalechess.org/privkey.pem");
  let certificate = readFileSync("/etc/letsencrypt/live/royalechess.org/cert.pem");
  let credentials = {key: privateKey, cert: certificate};

  let server = createServer(credentials, app);
  app.use(express.static("../../main"));
  server.listen(443, () => {
    console.log("listening on *:443");
  });
  let httpServer = createHttp((req, res) => {
    res.statusCode = 301;
    res.setHeader("Location", "https://royalechess.org");
    res.end("Insecure connections are not allowed. Redirecting...");
  });
  httpServer.listen(80, () => {
    console.log("Listening on *:80");
  });
  return server;
}

export {initializeHttp, initializeHttps};
