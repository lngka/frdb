"use strict"
const mysql      = require('mysql');

module.exports = function (connection) {
    // init mySQL
    var connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'lngka',
      password : '',
      database : 'uni'
    });
    connection.connect();
    /*
    * 
    */
    this.getLoginInfoByInfoID = function(infoID, callback) {

        connection.query("SELECT * FROM ws_logininfo WHERE InfoID=?", [infoID], function (error, results, fields) {
                if (error) {
                    return callback(error);
                }
                return callback(null, results);
            });
    }
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
                return callback(error, null);
            }
            return callback(null, results[0]);
        });
    }
}