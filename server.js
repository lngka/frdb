"use strict";

// requirements
const express    = require("express");
const path       = require("path");
const dotenv     = require("dotenv");
const route      = require("./app/routes/index.js");
const bodyParser = require("body-parser");


// init environment
dotenv.load();


// init app
const app = express();

/** bodyParser.urlencoded(options)
 * Parses text as URL encoded data
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({"extended": true}));
app.use(bodyParser.json());

// routes configuration
route(app);

// start app
var port = process.env.PORT;
app.listen(port || 3000, function() {
    console.log("Listening on: " + port || "3000");
});
