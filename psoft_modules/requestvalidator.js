/*
 ever3stmomo -  5/1/2018
 requestvalidator.js  - middleware layer that validates all (/api/v1) requests
 */

var jwt = require('jwt-simple');
var validateUser = require('./authmodule').validateAccess;
var util = require('./utils');

module.exports = function(req, res, next) {

    var token = "";
    if(!util.isEmptyObject(req.headers.authorization)){
        //Check Bearer token first
        token = util.parseAuthToken(req.headers.authorization);
    }
    else
    {
        token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
    }
    if (!util.isEmptyObject(token)) {

        var decoded = "";
        try{
            decoded = jwt.decode(token, require('../config/jwtkey.js')());
        }
        catch(jwtErr){
            res.status(401)
                .json({
                    success  : false,
                    "message": jwtErr.message
                });
            res.end();
            return;
        }
       try {
            if (decoded.exp <= Date.now()) {
                res.status(400)
                    .json({
                        success     : false,
                        "message"   : "Token Expired"
                    });
                res.end();
                return;
            }
            // Authorize the user to see if s/he can access our resources
            validateUser(decoded.email)
                .then(function(userResponseObject){
                    if (userResponseObject) {
                        if ((req.url.indexOf('admin') >= 0 && userResponseObject.dataValues.isr00t) || (req.url.indexOf('admin') < 0 && req.url.indexOf('/api/v1/') >= 0)) {
                            //inject user info into the request that should be available for all /api/v1 request paths
                            req.psoftUser = {
                                ID          : userResponseObject.dataValues.userID,
                                name        : userResponseObject.dataValues.name,
                                admin       : (userResponseObject.dataValues.isr00t === 1)
                            };
                            next();                         // To move to next middleware
                        } else {
                            res.status(403)
                                .json({
                                    success : false,
                                    "message": "Not Authorized"
                                });
                            return;
                        }
                    } else {
                        // No user with this name exists, respond back with a 401
                        res.status(401)
                            .json({
                                success : false,
                                "message": "Invalid User"
                            });
                        res.end();
                        return;
                    }
                })
                .catch(function(err){
                    res.status(500)
                        .json({
                            success : false,
                            "message": err.message
                        });
                    res.end();
                    return;
                });
        } catch (err) {
            res.status(500)
                .json({
                    success : false,
                    "message": err.message
                });
            res.end();
            return;
        }
    } else {
        res.status(401)
            .json({
                "message": "Missing or invalid access token"
            });
        res.end();
        return;
    }
};