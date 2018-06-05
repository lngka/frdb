"use strict";

// requirements
const express    = require("express");
const path       = require("path");
const dotenv     = require("dotenv");
const route      = require("./app/routes/index.js");
const bodyParser = require("body-parser");
const mysql      = require('mysql');

// init environment
dotenv.load();


// init app
const app = express();

// init static directory
app.use("/public", express.static(path.join(process.cwd(), "public")));

/** bodyParser.urlencoded(options)
 * Parses text as URL encoded data
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({"extended": true}));

// init mySQL
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'lngka',
  password : '',
  database : 'uni'
});
connection.connect();

// routes configuration
route(app, connection);

// start app
var port = process.env.PORT;
app.listen(port || 3000, function() {
    console.log("Listening on: " + port || "3000");
});
