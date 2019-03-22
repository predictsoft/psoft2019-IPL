/*
 ever3stmomo - 5/1/2018
 routes.js  - handles routing for psoft service
 */

var express = require('express');
var router = express.Router();

var auth = require('./authmodule');
var PSUtils = require('./utils');
var PSUsers = require('./users');
var PSMatch = require('./games');

/*
 * Routes that can be accessed by any one
 */
router.get('/ping',PSUtils.ping);
router.get('/temp');
router.get('/user/:id',PSUsers.getUserDetails);

router.post('/login', auth.login);
router.post('/register', PSUsers.addUser);                      // Register new user

/*
 * Routes that can be accessed only by authenticated users
 */
router.get('/v1/auth/ping',PSUtils.ping);

//game/match route
router.get('/v1/games/active',PSMatch.fetchActiveMatches);          //get all active (upcoming) matches
router.get('/v1/game/:id',PSMatch.fetchMatchDetails);               //get details of a match
router.get('/v1/games/next',PSMatch.fetchNextActiveMatch);

//prediction route
router.get('/v1/games/prediction',PSMatch.getPredictionsForActiveMatches);
router.get('/v1/games/prediction/stats',PSMatch.getPredictionStats);
router.post('/v1/games/predict',PSMatch.addOrUpdatePredictions);

router.get('/v1/scores',PSMatch.getScoreboardList);

//player/user routes
router.get('/v1/player/:id/history',PSUsers.getPlayerPredictionHistory);
router.get('/v1/player/points',PSUsers.getUserPoints);


/* admin routes */
//router.put('/v1/admin/lock/:id',"");                                //lock match by ID
router.post('/v1/admin/update',PSUtils.updateScores);                   //update scores for a match
router.put('/v1/admin/lock/active',PSUtils.lockNextActiveMatch);        //lock all active matches
router.put('/v1/admin/activate',PSUtils.activateNextDayMatches);        //manually mark upcoming matches (in the next 1 day) as active

module.exports = router;