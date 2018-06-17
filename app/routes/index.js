"use strict";
const logininfo    = require("./login-info.js");
const actions      = require("./actions.js");
const status       = require("./status.js");
const login        = require("./login.js");
const order        = require("./order.js");
const getorders    = require("./getorders.js");
const search       = require("./search.js");

const dbController = require("../controllers/db-controller.js");

module.exports = function(app) {
    // init database object
    const db = new dbController();
    
    app.route("/")
        .get(function(req, res) {
            res.send("Hello World!");
        });
        
    // other routes
    logininfo(app, db);
    actions(app, db);
    status(app, db);
    login(app, db);
    search(app, db);
    order(app, db);
    getorders(app, db);
};
