"use strict";
const mysql = require('mysql');

module.exports = function () {
    // init mySQL
    var connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'lngka',
      password : '',
      database : 'uni'
    });
    try {
        connection.connect();
    } catch (e) {
        console.error(e);
        process.exit();
    }
    
    /*
    * 
    */
    this.getLoginInfoByInfoID = function(infoID, callback) {
        connection.query("SELECT * FROM ws_logininfo WHERE InfoID=?", [infoID], function (error, results, fields) {
                if (error)
                    return callback(error);
                    
                return callback(null, results);
        });
    };
    
    /*
    * Gibt zulässige Aktionen zurück
    */
    this.getActions = function(callback) {
        connection.query("SELECT * FROM ws_aktion", function (error, results, fields) {
            if (error) {
                return callback(error);
            }
            return callback(null, results);
        });
    }
    
    /*
    * Gibt ws_status zurück
    */
    this.getStatuses = function(callback) {
        connection.query("SELECT * FROM ws_status", function (error, results, fields) {
            if (error) {
                return callback(error);
            }
            return callback(null, results);
        });
    }
    
    /*
    * Temporäre Authentifizierung-Methode
    */
    this.pseudoAuthenticate = function(loginData, callback) {
        // No SQL Injection please!
        for (var key in loginData) {
            loginData[key] = mysql.escape(loginData[key]);
        }

        var sqlString = "SELECT LoginID FROM ws_login WHERE Login=" +loginData.login+ "AND Passwort=" + loginData.password;
        
        connection.query(sqlString, function (error, results, fields) {
            if (error) {
                return callback(error, null);
            }
            
            if (!results[0]) {
                let error = new Error("Login/Password Invalid");
                error.code= 400;
                return callback(error, null);
            }
            return callback(null, results[0]);
        });
    };
    
    /*
    * zulässige Akten eines loginIDs durchsuchen
    */
    this.getRecordsByKeywordAndLoginID = function(keyword, loginID, callback) {
        getRecordIDsByLoginID(connection, loginID, function(error, recordIDS) {
            if (error)
                return callback(error, null);
            
            if (!recordIDS.length) {
                let error = new Error("User not yet authorized to any record");
                error.code= 400;
                return callback(error, null);
            }
            
            var tokens = new Array(recordIDS.length).fill('?').join(',');
            let sqlString = `
                SELECT oi.Titel, o.OrdnerID, o.Barcode, o.Image, o.KategorieID, o.StatusID, o.DatumGeändert 
                FROM ws_ordner AS o
                INNER JOIN ws_ordnerindex AS oi 
                ON oi.OrdnerID=o.OrdnerID
                WHERE oi.OrdnerID IN (${tokens})
                AND oi.Titel LIKE "%${keyword}%"`;

            connection.query(sqlString, recordIDS, function(error, results, fields) {
                if (error)
                    return callback(error, null);
                return callback(null, results);
            });
            
        });
    };
    
    /*
    * Auftrag anlegen
    */
    this.order = function(orderData, callback) {
        // sanity check
        if (!checkOrderData(orderData)) {
            let err = new Error("Invalid orderData");
            err.code = 400;
            return callback(err, null);
        }
        
        // ownership check
        getRecordIDsByLoginID(connection, orderData.loginID, function(error, ownedRecordIDs) {
            if (error) return callback(error, null);
            if (!ownedRecordIDs.length) {
                let error = new Error("Not authorized to any records");
                error.code= 400;
                return callback(error, null);
            }
            
            let orderedRecordIDs = [];
            orderData.orderArray.forEach(function(orderItem) {
               orderedRecordIDs.push(orderItem.OrdnerID);
            });
            for (let i = 0; i < orderedRecordIDs.length; i++) {
                if (orderedRecordIDs[i] in ownedRecordIDs)
                    continue;
                else {
                    let error = new Error("Not authorized to OrdnerID: " + orderedRecordIDs[i]);
                    error.code= 400;
                    return callback(error, null);
                }
            }
            // ownership check END
            
            // handle orders...
            var len = orderData.orderArray.length;
            var stop = false;
            for (let i = 0; i < len; i++) {
                if (stop) break;
                
                connection.beginTransaction(function(error) {
                    if (error) {
                        stop = true;
                        return callback(error, null);
                    }
                    
                    var datum     = Date.now();
                    var auftragNr = "WS-uni-" + datum;
                    var loginID   = orderData.loginID;
                    var auftragID;
                    var mysqlString1 = `
                        INSERT INTO uni.ws_auftrag
                        SET
                        AuftragNr="${auftragNr}",
                        Datum=${datum},
                        LoginID=${loginID};
                    `
                    connection.query(mysqlString1, function (error, results, fields) {
                        if (error) {
                            callback(error, null)
                            connection.rollback();
                            stop = true;
                            return; 
                        }
                        
                        auftragID = results.insertId;
                        var aktionID = orderData.orderArray[i].AktionID;
                        var ordnerID = orderData.orderArray[i].OrdnerID;
                        var preis    = actionIDtoPrice(aktionID);
                        var mysqlString2 = `
                            INSERT INTO uni.ws_auftragordner
                            SET
                            AktionID="${aktionID}",
                            AuftragID=${auftragID},
                            OrdnerID=${ordnerID},
                            OrdnerText="",
                            Preis=${preis};
                        `;
                        
                        connection.query(mysqlString2, function(error, results, fields) {
                            if (error) {
                                callback(error, null)
                                connection.rollback();
                                stop = true;
                                return; 
                            }
                            
                            connection.commit(function(error) {
                                if (error) {
                                    callback(error, null);
                                    connection.rollback();
                                    stop = true;
                                    return;
                                }
                                
                                return callback(null, "OK");
                            })
                        });
                    })
                // WORKINGWORKINGWORKINGWORKING
                });
            }
        });
    };
    
    /*
    *
    */
    this.getOrdersByLoginID = function(loginID, callback) {
        let sqlString = `
            SELECT ag.AuftragID, ag.OrdnerID, oi.Titel, ag.AktionID, o.StatusID, ag.Preis 
            FROM ws_auftragordner AS ag
            INNER JOIN ws_ordnerindex AS oi 
            ON oi.OrdnerID=ag.OrdnerID
            INNER JOIN ws_ordner AS o
            ON o.OrdnerID=ag.OrdnerID
            WHERE AuftragID 
            IN (
                SELECT AuftragID
                FROM ws_auftrag
                WHERE LoginID=${loginID}
            );
        `;
        
        connection.query(sqlString, function(error, results, fields) {
            if (error) {
                return callback(error, null);
            }
            return callback(null, results);
        })
    }
}

/*
* Unterprogramm um zulässige Akten zu holen
* @params loginID {String}
* @params connection {Object) mySQL connection object
* @params callback {Function} als callback(error, RecordIDs)
* @return RecordIDs {Array} ein Feld von zulässigen Akten-IDs (OrdnerID)
*/
function getRecordIDsByLoginID(connection, loginID, callback) {
    try {
        let sqlString = "SELECT OrdnerID FROM ws_gruppeordner INNER JOIN ws_gruppelogin gl ON gl.LoginID=?";
        connection.query(sqlString, [loginID], function (error, results, fields) {
            if (error) {
                return callback(error, null);
            }
            
            // mySQL RowDataPacket zu Array umwandeln
            let recordIDS = [];
            results.forEach(function(row){
                recordIDS.push(row.OrdnerID);
            })
            
            return callback(null, recordIDS);
        });
    } catch (e) {
        return callback(e, null);
    }
}

/*
* Unterprogramm zur Überprüfung der Gültigkeit von orderData
* @params orderData {Object}
* @return result {Boolean}
*/
function checkOrderData(orderData) {
    if (!orderData.hasOwnProperty("loginID"))
        return false;
    if (!orderData.hasOwnProperty("orderArray"))
        return false;
    if (!Array.isArray(orderData.orderArray))
        return false;
        
    let validity = true;
    let len = orderData.orderArray.length;
    
    for (var i = 0; i < len; i++) {
        if (!orderData.orderArray[i].hasOwnProperty("AktionID")) {
            validity = false;
            break;
        }
        if (!orderData.orderArray[i].hasOwnProperty("OrdnerID")) {
            validity = false;
            break;
        }
    }
    // TODO: check ActionID against StatusID
    return validity;
}

/*
* Preis einer Aktion
*/
function actionIDtoPrice(id) {
    var prices = [0, 3000, 800, 700, 6000, 2800];
    return prices[id] || 0;
}