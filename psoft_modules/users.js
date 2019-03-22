/*
 ever3stmomo - 5/1/2018
 users.js  - handles all user related functions
 */

const util = require('./utils');
const log = util.Log;
const config = util.Config;
const database = util.Database;
const queries = database.QueryList;

var TFUsers = {
    /* Register a user (while registration period is open, defined in config file) */
    addUser: function(req,res){
        var responseObject = {};
        var reqEmail = (req.body && req.body.email) || 'N/A';
        
        if (!config.psIsRegistrationActive) {
            log.warn("Registration period has expired. Unable to register account for " + reqEmail);
            responseObject = {
                success : false,
                message : "Registration period has ended. New accounts will not be added!"
            }
            res.status(401).json(responseObject);
            res.end();
            return;
        }
        
        if(!req.body || !req.body.name || !req.body.password || !req.body.email){
            responseObject = {
                success : false,
                message : "Please enter all required fields"
            }
            res.status(400).json(responseObject);
            res.end();
            return;
        }

        //check if email ID already exists
        util.Database.User.find({
            where: {
                email: req.body.email,
            }
        }).then(function (userExistsResponse) {
            if(!util.isEmptyObject(userExistsResponse))
            {
                responseObject = {
                    success : false,
                    message : "That email address has already been registered."
                };
                res.status(400).json(responseObject);
                res.end();
                return null;        //this return is for next then block
            }

            return database.User
            .build({
                name    : req.body.name,
                email   : req.body.email,
                password: req.body.password,
                auth_key: req.body.token,
                points  : 0
            })
            .save();
        })
        .then(function(registrationResponseObject){
            if(!util.isEmptyObject(registrationResponseObject)){
                log.info("New user account has been successfully added with email: ",req.body.email);    
                responseObject = {
                        success : true,
                        message : "Successfully registered account"
                    };
                res.status(200).json(responseObject);
                res.end();
                return;
            }
        })
        .catch(function(error){
            log.warn('Error trying to register user account with email ',req.body.email,'.Details:\r\n',error);
            res.status(400).json();
            res.end();
            return;
        })
    },
    
    /* Update user details */
    updateUser: function(req,res){

    },

    /* GET /review by :id */
    getUserDetails: function (req, res) {
        var responseObject = {};
        //if(!req.body || !req.body.id || util.isEmptyObject(req.body.id)){
        if(!req.params.id || util.isEmptyObject(req.params.id)){
            responseObject = {
                success : false,
                message : 'Missing user id'
            }
            res.status(400).json(responseObject);
            res.end();
            return;
        }
        database.User.find({
            where: {
                userID   : req.params.id    
            }
        })
        .then(function(userResponseObject){
            if(util.isEmptyObject(userResponseObject)){
                responseObject = {
                    success : false,
                    message : 'User not found'
                }
            }
            else{
                responseObject = {
                    success : true,
                    data : {
                        name    : userResponseObject.name,
                        email   : userResponseObject.email,
                        points  : userResponseObject.points
                    }
                }
            }
            res.status(200).json(responseObject);
            res.end();
            return;
        })
        .catch(function(err){
            log.warn('Error trying to fetch user account details for id :',req.params.id,". Details:\r\n",err);
            responseObject = {
                success : false,
                message : "Error trying to get user details"
            }
            res.status(500).json(responseObject);
            res.end();
            return;
        })
    },

    /* GET prediction history for all past matches for player id */
    getPlayerPredictionHistory: function(req,res){
        var _response = {};
        var player_id = req.params.id;
        database.query(
            queries.getUserPredictionHistory(player_id),
            database.DBConnection.QueryTypes.SELECT
        )
        .then(userHistoryResponseObject=>{
            _response = {
                success         : true,
                message         : "OK",
                user_name       : userHistoryResponseObject[0].player_name || 'N/A',
                user_points     : userHistoryResponseObject[0].player_points || 0,
                results         : (userHistoryResponseObject)||{} 
            }
            res.status(200).json(_response);
            res.end();
            return;
        })
        .catch(error=>{
            log.error('Users:getPlayerPredictionHistory() - Cannot fetch prediction history for player ID ' + req.params.id + ' games. Details: ',error);
            _response = {
                success: false,
                message: 'The request could not be completed. The mods will be notified.'
            }
            res.status(500).json(_response);
            res.end();
            return;
        })
    },

    /* GET score/points for current player by ID */
    getUserPoints: function(req,res){
        database.User.findOne({
            where:{
                userID: req.psoftUser.ID
            }
        })
        .then(userRow=>{
            res.status(200).json({
                success : true,
                points    : userRow.points
            }) 
        })
        .catch(err=>{
            log.error('User:getUserPoints() - Cannot fetch user points. Details: ',error);
            _response = {
                success: false,
                message: 'The request could not be completed. The mods will be notified.'
            }
            res.status(500).json(_response);
            res.end();
            return;
        });       
    }
}

module.exports = TFUsers;