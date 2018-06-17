"use strict";

module.exports = function(app, db) {
    
    app.route("/getorders")
        .get(function(req, res) {
            var loginID = req.query.loginID;
            if (!loginID)
                return res.status(400).send("Missing loginID");
                
            db.getOrdersByLoginID(loginID, function(err, results) {
                res.setHeader("Content-Type", "application/json");
                if (err) {
                    res.status(500).send(JSON.stringify(err));
                    return;
                }
                res.send(JSON.stringify(results));
            })
            
        });
};
