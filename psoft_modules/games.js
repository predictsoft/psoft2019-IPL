/*
 ever3stmomo -  5/1/2018
 games.js  - handles all match related functions
 */

const util = require('./utils');
const log = util.Log;
const config = util.Config;
const database = util.Database;
const queries = database.QueryList;

var TFGames = {
    //GET details about all upcoming/active matches
    fetchActiveMatches : function(req,res){
        var _response = {};
        database.query(
            queries.getUpcomingMatchDetails(),
            database.DBConnection.QueryTypes.SELECT
        )
        .then(gamesResponseObject=>{
            _response = {
                success         : true,
                message         : "OK",
                number_of_games : (gamesResponseObject && gamesResponseObject.length)|| 0,
                match_date      : (gamesResponseObject && gamesResponseObject[0] && gamesResponseObject[0].GameDate) || '',
                results         : (gamesResponseObject)||{} 
            }
            res.status(200).json(_response);
            res.end();
            return;
        })
        .catch(function(error){
            log.error('TFGames:fetchActiveMatches() - Cannot fetch upcoming games. Details: ',error);
            _response = {
                success: false,
                message: 'The request could not be completed. The mods will be notified.'
            }
            res.status(500).json(_response);
            res.end();
            return;
        })
    },

    //GET the next/upcoming active match (config.lock_threshold interval)
    fetchNextActiveMatch: function(req,res){
        var _response = {};
        database.query(
            queries.getNextUpcomingMatchDetail(util.Config.psManualLockThreshold,util.Config.psTZOffset),   //util.Config.psTZOffset),
            database.DBConnection.QueryTypes.SELECT)
            .then(gameResponseObject=>{
                _response = {
                    success         : true,
                    message         : "OK",
                    data            : gameResponseObject[0] || [],
                    number_of_rows  : gameResponseObject.length
                };
                res.status(200).json(_response);
                res.end();
                return;
            })
            .catch(error=>{
                log.error('TFGames:fetchNextActiveMatch() - Cannot fetch the upcoming game in the next ' + util.Config.psManualLockThreshold + ' minutes. Details: ',error);
                _response = {
                    success: false,
                    message: 'The request could not be completed. The mods will be notified.'
                }
                res.status(500).json(_response);
                res.end();
                return;
            });
    },

    //GET details of one match
    fetchMatchDetails : function(req,res){
        database.query(
            queries.getMatchDetails(req.params.id),
            database.DBConnection.QueryTypes.SELECT
        )
        .then(gameDetails => {
            res.status(200).json({
                success     : true,
                data        : (gameDetails && gameDetails[0]) || {}
            });
            res.end();
            return;
        })
        .catch(error=>{
            log.error('TFGames:fetchMatchDetails() - Cannot fetch details for game ID ' + req.params.id + '. Details: ',error);
            res.status(500).json({
                success: false,
                message: 'The request could not be completed. The mods will be notified.'
            });
            res.end();
            return;
        });
    },

    /* POST prediction(s) for a user */
    addOrUpdatePredictions : function(req,res){
        var _response = {};
        var addPredictionPromiseList = [];
        if(util.isEmptyObject(req.body) || util.isEmptyObject(req.body.predictionData)){
            log.warn('Error trying to add prediction: Invalid request received ( '+ ((req.body)||'Undefined') + ')');
            _response = {
                success : false,
                message : "The prediction could not be added/updated at this time. Please try after some time"
            }
            res.status(500).json(_response);
            res.end();
            return;
        }
        var predictionList = req.body.predictionData;
        predictionList.forEach(element => {
            addPredictionPromiseList.push(addOrUpdatePrediction(req.psoftUser.ID, req.psoftUser.name, element.matchID, element.teamID, element.teamName));
        });

        return Promise.all(addPredictionPromiseList)
        .then(predictionResponseList =>{
             _response = {
                success         : true,
                message         : "OK",
                results         : predictionResponseList
            }
            res.status(200).json(_response);
            res.end();
            return;
        })

        .catch(error=>{
            log.error('TFGames:addOrUpdatePredictions() - Cannot submit prediction. Details: ',error);
            _response = {
                success : false,
                message : 'The request could not be completed. The mods will be notified.'
            }
            res.status(500).json(_response);
            res.end();
            return;
        });
    },

    /* GET list of predictions */
    getPredictionsForActiveMatches : function(req,res){
        var _response = {};
        database.query(
            queries.getPredictionListForActiveMatches(req.psoftUser.ID),
            database.DBConnection.QueryTypes.SELECT
        )
        .then(gamesResponseObject=>{
            _response = {
                success         : true,
                message         : "OK" ,
                /*number_of_games : (gamesResponseObject && gamesResponseObject.length)|| 0,
                match_date      : (gamesResponseObject && gamesResponseObject[0] && gamesResponseObject[0].GameDate) || '', */
                results         : (gamesResponseObject)||{} 
            }
            res.status(200).json(_response);
            res.end();
            return;
        })
        .catch(function(error){
            log.error('TFGames:getPredictionsForActiveMatches() - Cannot fetch upcoming games. Details: ',error);
            _response = {
                success: false,
                message: 'The request could not be completed. The mods will be notified.'
            }
            res.status(500).json(_response);
            res.end();
            return;
        })
    },

    /* GET scoreboard list */
    getScoreboardList: function(req,res){
        /* database.User.findAll({
            attributes  : ['userID','name','points'],
            order       : 'points Desc'
        }) */
        database.query(
            queries.getUserScores(),
            database.DBConnection.QueryTypes.SELECT
        )
        .then(scoreList=>{
            
            res.status(200).json({
                success : true,
                message : "OK",
                results : scoreList
            });
            res.end();
            return;
        })
        .catch(err =>{
            log.warn("Error trying to fetch scoreboard. Details: ",err);
            res.status(500).json({                
                success : false,
                message : "Could not fetch scoreboard"
            });
            res.end();
            return;
        });
    },

    /* GET the total number of players and number of remaining predictions */
    getPredictionStats: function(req,res){
        
        database.query(
            queries.getPredictionStatsQuery(config.psHidePredictionMode),
            database.DBConnection.QueryTypes.SELECT
        )
        .then(predStats=>{
            
            predStats[0]['total_players'] = predStats[0]['total_players'] - 1;      //takes the [admin] account out of the count
            res.status(200).json({
            success : true,
            message : "OK",
            results : predStats
        });
            res.end();
            return;
        })
        .catch(err =>{
            log.warn("Error trying to fetch number of predictions received. Details: ",err);
        res.status(500).json({
            success : false,
            message : "Could not fetch number of predictions received"
        });
        res.end();
        return;
        })
    }
};

var addOrUpdatePrediction = function(userID, userName, matchID, predictedTeamID, predictedTeamName)
{
    return new Promise(function(resolve,reject){

        //check if match is valid (not locked yet)
        return database.Game.find({
            where: {
                ID: matchID,
                isLocked: 0
            }
        })
        .then(lockedCheckResult =>{
            if(util.isEmptyObject(lockedCheckResult))
            {
                //locked match 
                log.warn("User " + userName + " has submitted a prediction for match ID " + matchID + " after the lockdown period and has been denied access to do so (tried to insert/update team: " + predictedTeamName + ") ");
                resolve({
                    //match_id            : matchID,
                    post_lock_attempt   : true,
                    message             : "Your predicted team '" + predictedTeamName + "' could not be submitted because the prediction window has closed"
                });
                return;                
            }
            else{
                return database.Prediction
                .findOrCreate
                ({
                    where: {playerID: userID, matchID: matchID},
                    defaults: {predictedTeamID: predictedTeamID}
                })
                 .spread((predictionRowResult,created)=>{
                    if(created){
                        log.info("New prediction has been added for user ID ",userID," (",userName,"), for match ID ",matchID," (Team: ",predictedTeamName,")");
                        resolve({
                            matchID : matchID,
                            player  : userName,
                            Team    : predictedTeamName
                        });
                        return;
                    }
                    else{
                        //prediction exists, update it
                        var predictionRow = (predictionRowResult && predictionRowResult.dataValues) || {playerID: userID, matchID: matchID};
                        database.query(
                            queries.updatePredictionForMatch(predictionRow.playerID,predictionRow.matchID,predictedTeamID),
                            {model: database.Prediction}
                        ).then(predictionResult=>{
                            log.info("Prediction for user ID ",userID," (",userName,") has been updated for match ID ",matchID," (Team: ",predictedTeamName,")");
                            resolve({
                                matchID : matchID,
                                player  : userName,
                                Team    : predictedTeamName
                            });
                            return;
                        })
                    }
                })
            }
        })
        .catch(err =>{
            log.warn('Could not add/update prediction for user ID: ',userID,' for match ',matchID,'.\r\nDetails: ',err);
            reject(err);
        })
      });
}


module.exports = TFGames;