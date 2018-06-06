"use strict";

module.exports = function(app, db) {
    
    app.route("/login")
        .post(function(req, res) {
            
            var loginData = {
                "company": req.body.company,
                "login": req.body.login,
                "password": req.body.password
            }
            
            for (var key in loginData) {
                if(!loginData[key])
                    return res.status(400).send("Missing login credentials");
            }
            
            db.pseudoAuthenticate(loginData, function(err, loginID) {
                res.setHeader("Content-Type", "application/json");
                if (err) {
                     res.status(500).send(JSON.stringify(err.message));
                     return;
                }
                res.status(200).send(JSON.stringify(loginID));
            });
            
        });
};
