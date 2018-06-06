"use strict";

module.exports = function(app, db) {
    
    app.route("/actions")
        .get(function(req, res) {
            db.getActions(function(err, results) {
                res.setHeader("Content-Type", "application/json");
                if (err) {
                    res.status(500).send(JSON.stringify(err));
                    return;
                }
                res.send(JSON.stringify(results));
            });
        });
};
