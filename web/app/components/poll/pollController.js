/*
grjoshi 3/10/2016
Controller that handles 
	- loading up poll page, with team names
*/
(function () {
    angular.module("psoftUI").controller("pollController", pollCtrl);
    pollCtrl.$inject = ['$scope', '$location', 'userService', 'authService', 'gameService', '$timeout'];
    
    function pollCtrl($scope, $location, userService, authService, gameService, $timeout) {
        
        $scope.games = [];
        $scope.selection = [];				//array of {usrID, matchID, teamID} objects			
        $scope.predErr = false;				//flag showing error if all selections aren't made	
        $scope.nogames = false;				//flag to show message if no games are available
        
        $scope.loadingGames = true;         //flag to show "Loading games...." animation
        
        $scope.submitResponseERR = "";
        $scope.showConfirmation = false;

        $scope.msg_announcement = '';
        $scope.display_announcement = true;            //TODO: move these to config/exports file
        $scope.playerFirstName = authService.getFirstName();

        $scope.predictionGridLoaded = true;

        $scope.allValidPredictionsReceived = false;

        $scope.matchDate = '';

        $scope.matchDateTime = '';
        $scope.matchType = '';
        $scope.matchPoints = 0;

        var now = new Date();

        // $scope.lockDown = false;
        
        //	$scope.isPointsTableLoaded = false;
        
        // $scope.predictionGrid = {
        //     columnDefs: [{ field: 'Name', displayName: 'Name' },
        //         { field: 'Team', displayName: 'Predicted Team' }]
        // };
        
        $scope.hasPredicted = true;
        

        //visibility for poll options      
        $scope.showPolls = function () {
            
            if ($scope.games.length > 0) {
                return true;
            }
            else {
                return false;
            }
        };

        $scope.showDateRemaining = function(predLockTime){
            return (now < predLockTime);
        };

        $scope.showDaysRemaining = function(predLockTime){

            //console.log(new Date(predLockTime).getDay() != now.getDay());
            return (new Date(predLockTime).getDay() != now.getDay());
        };

        $scope.getRemainingPlayerCount = function(){
            var totalPredictions = 0; //gameService.getRemainingPredictionCount(authService.getToken());
            //console.log("????",totalPredictions);
            return totalPredictions;
        }

/*
        var getPredictionTable = function () {
            
            //quick hack for semi and finals:
            if ($scope.lockDown) {
                $scope.predictionGrid = { data: '' };		//comment to show prediction grid 
                return;
            }
            
            //get Prediction from API
            gameService.getPredictionList($scope.user_token)
			.then(function (response) {
                if (response == null) {
                    throw "There was an error trying to fetch prediction data from the web service. Please try again later";
                }
                if (!response.data.success) { throw response.data.message; }
                //console.log(angular.toJson(response.data));
                
                if (response.data.predictData.length == 1) {
                    $scope.lockDown = true;
                }
                $scope.predictionGrid.data = response.data.predictData;
            })
			.catch(function (err) {
                console.log("Unable to fetch prediction table. Details:\n" + err)
            })
        }
*/

        if (!authService.isLoggedIn()) {
            //try loading user session from localstorage
            if (!authService.loadSession()) {
                //no session saved either, so redirect to login
                $location.path("/login");
            }
        }
        else {
            //getLeaderBoard();			//load score table - moved to scoreboardController.js
            //getPredictionTable();		//load prediction table

            //get list of active games
            gameService.getAllActiveMatches(authService.getToken())
            .then(function (response) {
                var gamesObject = response.data;
                
                $scope.loadingGames = false;            //hide the "Loading...." animation
                if (!response || !gamesObject) {
                    var noRespErr = "There was an error trying to connect to the web service. Please try again later";
                    $scope.submitResponseERR = noRespErr;
                    throw noRespErr;
                }
                if (!gamesObject.success) {
                    var error = (gamesObject && gamesObject.message) || 'Something went wrong. Please contact the admin';
                    $scope.submitResponseERR = error;
                    throw error;
                }
                $scope.nogames = (gamesObject.number_of_games <= 0);
                if ($scope.nogames) {
                    //no games marked as isActive=1 on the database
                    $scope.matchType = '';
                    display_announcement = false;
                }
                else {
                    $scope.games = gamesObject.results.slice();		//copy games info to scope
                    $scope.matchDate = gamesObject.match_date;
                    //$scope.remainingPredictions = gamesObject.rem_predictions;
                    //gameService.setRemainingPredictionCount(gamesObject.rem_predictions);

                    //var matchDateTime = new Date($scope.games[0].GameDate).getDate() + $scope.games[0].GameTime ;
                    var matchDateTime = moment(moment($scope.games[0].GameDate,"MMDDYYYY") + " " + $scope.games[0].GameTime);

                    

                    //var targetDateMsec = new Date($scope.games[0].GameDate).getTime() -  15*60000;
                    //$scope.matchDateTime = (targetDateMsec > 0) ? (new Date($scope.games[0].GameDate).getTime() - 15 * 60000) : '';       //get 15 min prior to match time in msec

                    //matchDateTime.setHours(new Date($scope.games[0].GameTime).getHours);
                    $scope.matchType = ($scope.games[0].GameType ) || '';
                    $scope.matchPoints =   $scope.games[0].GamePoints || 0;
                }
                return;
            })
            .catch(function (err) {
                if(err.data && err.data.message === "Token Expired"){
                    //expired token, redirecting to login
                    $location.path("/login");
                }
                $scope.submitResponseERR = "Error trying to get match(es) data. The admin will be notified.";
                console.log("ERROR: " + err);
                return;
            })
        }
        
        
        $scope.submitPoll = function () {
            //submit prediction data to the server
            $scope.submitResponseERR = "";
            //check if all NON-LOCKED matches have been predicted
            var lgc = 0;        //locked games count
            $scope.games.forEach(function(g){
                    if(g.IsGameLocked) lgc++;
            });

            //check total game count = number of selection + locked games
            if ($scope.games.length != ($scope.selection.length + lgc)) {
                $scope.predErr = true;
                return;
            }
            else {
                //try submitting
                $scope.predErr = false;
                gameService.submitPrediction(authService.getToken(), $scope.selection)
                .then(function (response) {
                    var predictionResponseObject = response.data;
                    if(!predictionResponseObject || !predictionResponseObject.success){
                        console.error(response);
                        throw response;
                    }
                    $scope.showConfirmation = true;
                    //$location.path("/poll");
                    return;
                })
                .then(function(){

                    $scope.predictionGridLoaded = false;
                    $scope.predictionGrid = gameService.getPredictionGrid();
                    //wait for 3 seconds (to allow all updates) and refresh prediction grid
                    $timeout(function(){
                        gameService.getPredictionList(authService.getToken())
                        .then(function (response) {
                            var predictionListObject = response.data;
                            if (!response || !response.data || !predictionListObject.success) {
                                throw "There was an error trying to fetch prediction data from the web service. Please try again later";
                            }

                            gameService.setRemainingPredictionCount(predictionListObject.remaining_predictions);
                            gameService.fillPredictionGrid(predictionListObject.results);      //for dynamic refreshing of prediction grid
                            $scope.predictionGridLoaded = true;
                        })
                    },3000);                                                        //refresh after 5 seconds
                })
                .catch(function (err) {
                    if(err.data && err.data.message === "Token Expired"){
                        //expired token, redirecting to login
                        $location.path("/login");
                    }    
                    $scope.submitResponseERR = "There was an error trying to send the prediction data. Please try again later";
                    $scope.is_valid = false;
                })
            }
        };
        
        //add each match's predictions inside a JSON object, to send back to server
        $scope.selectTeam = function (matchID, teamID, teamName) {
            
            var doAdd = true;
            //builds the array to submit prediction data		
            $scope.selection.some(function (e) {
                //check if matchID key already exists and clear if so
                if (e.matchID === matchID) {
                    //Existing item found, updating with new selection
                    //e.userID = userService.usrObj.userID;//$scope.userID;
                    e.teamID = teamID;
                    e.teamName = teamName;
                    doAdd = false;
                    return;
                }
            });

            /*Disable for group of 16 onwards*/
            /*if(teamID == 50)
                return;*/

            if (doAdd) {
                $scope.selection.push(
                    {
                        //userID: userService.usrObj.userID,
                        matchID: matchID,
                        teamID: teamID,
                        teamName: teamName
                    });
            }

            var lockedGamesCount = ($scope.games && $scope.games.filter(games=>(games.IsGameLocked === 1)).length) || 0;

            if(($scope.selection.length + lockedGamesCount) === $scope.games.length){
                $scope.allValidPredictionsReceived = true;
            }
            else{
                $scope.allValidPredictionsReceived = false;
            }
            return;
        };

        $scope.div_click = function(matchID, teamID, teamName, otherTeamID, isLocked){

            //for a draw, team1ID vs otherTeamID are not selected/cleared
            //also, teamName never lie   \o/
            if(!isLocked) {
                if(teamName === "Draw"){
                    //draw
                    angular.element(document.querySelector('#divMatch' + matchID + '_' + teamID)).css('background-color', '#f2ece3');
                    angular.element(document.querySelector('#divMatch' + matchID + '_' + otherTeamID)).css('background-color', '#f2ece3');
                    angular.element(document.querySelector('#divMatch' + matchID + '_50')).css('background-color', '#80d4ff');
                    $scope.selectTeam(matchID, 50, 'Draw');
                }
                else {
                    //not draw, so clear that out
                    angular.element(document.querySelector('#divMatch' + matchID + '_50')).css('background-color', '#f2ece3');
                    angular.element(document.querySelector('#divMatch' + matchID + '_' + otherTeamID)).css('background-color', '#f2ece3');
                    angular.element(document.querySelector('#divMatch' + matchID + '_' + teamID)).css('background-color', '#80d4ff');
                    $scope.selectTeam(matchID, teamID, teamName);
                }
            }
        };

    }
})();