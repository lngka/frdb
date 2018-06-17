"use strict";

module.exports = function(app, db) {
    
    app.route("/order")
        .post(function(req, res) {
            res.setHeader("Content-Type", "application/json");

            db.order(req.body, function(err, result) {
               if (err) {
                   if (err.code) 
                       res.status(err.code).send(JSON.stringify(err.message));
                   else
                       res.status(500).send(JSON.stringify(err.message));
                return;
               }
               return res.status(200).send(JSON.stringify(result));
            });
        });
};
