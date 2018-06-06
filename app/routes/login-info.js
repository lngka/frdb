"use strict";

module.exports = function(app, db) {
    
    app.route("/logininfo")
        .get(function(req, res) {
            var infoID = req.query.id;
            if (!infoID)
                return res.status(400).send("Missing ID");
                
            db.getLoginInfoByInfoID(infoID, function(err, results) {
                res.setHeader("Content-Type", "application/json");
                if (err) {
                    res.status(500).send(JSON.stringify(err));
                    return;
                }
                res.send(JSON.stringify(results));
            })
            
        });
};
