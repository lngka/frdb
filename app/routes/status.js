"use strict";

module.exports = function(app, db) {
    
    app.route("/status")
        .get(function(req, res) {
            db.getStatuses(function(err, results) {
                res.setHeader("Content-Type", "application/json");
                if (err) {
                    res.status(500).send(JSON.stringify(err));
                    return;
                }
                res.send(JSON.stringify(results));
            });
        });
};
