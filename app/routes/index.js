"use strict";
const logininfo    = require("./login-info.js");
const actions      = require("./actions.js");
const login        = require("./login.js");

const dbController = require("../controllers/db-controller.js");

module.exports = function(app, connection) {
    // init database object
    const db = new dbController(connection);
    
    app.route("/")
        .get(function(req, res) {
            res.send("Hello World!");
        });
        
    // other routes
    logininfo(app, db);
    actions(app, db);
    login(app, db);
};
