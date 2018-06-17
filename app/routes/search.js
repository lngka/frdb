"use strict";

module.exports = function(app, db) {
    
    app.route("/search")
        .post(function(req, res) {
            var q = req.body;
            
            if (!q.keyword)
                return res.status(400).send("Missing keyword");
                
            if (!q.loginID)
                return res.status(400).send("Missing loginID, not authenticated");
            
                
            db.getRecordsByKeywordAndLoginID(q.keyword, q.loginID, function(err, results) {
                res.setHeader("Content-Type", "application/json");
                if (err) {
                    if (!err.code) 
                        return res.status(500).send(JSON.stringify(err.message));
                    if (err.code) 
                        return res.status(err.code).send(JSON.stringify(err.message));
                    return;
                }
                res.send(JSON.stringify(results));
            })
            
        });
};
