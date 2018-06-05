"use strict";

module.exports = function(app, connection) {
    app.route("/")
        .get(function(req, res) {
            
            connection.query("SELECT * FROM ws_logininfo", function (error, results, fields) {
                res.setHeader("Content-Type", "application/json");
                if (error) {
                    res.status(500).send(JSON.stringify(error));
                    return;
                }
                
                res.send(JSON.stringify(results));
            });
            
        });
};
