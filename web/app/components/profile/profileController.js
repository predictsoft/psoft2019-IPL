/*
    grjoshi 5/30/2016
    Controller that retrieves view-allowed (not locked or hidden) prediction history for current or any given user
 */
(function () {
    angular.module("psoftUI").controller("profileController", profileCtrl);
    profileCtrl.$inject = ['$scope', '$location', 'userService', 'authService', '$routeParams', '$window', 'md5'];
    function profileCtrl($scope, $location, userService, authService, $routeParams, $window, md5) {
        $scope.gameHistory = [];
        $scope.name = '';
        $scope.points = 0;

        var getMyGameHistory = function(token){
            userService.getPredictionHistoryByPlayerID(authService.getToken(),authService.getUserID())
                .then(function (response) {
                    if (!response || !response.data || !response.data.success) {
                        throw "There was an error trying to get user prediction history from the server. Please try again later";
                    }
                    var userPredictionHistoryObject = response.data;
                    if (userPredictionHistoryObject.results.length === 0) {
                        //show empty grid
                        console.info("Player prediction history is empty!");
                        $scope.gameHistory = [];
                    }
                    else {
                        $scope.gameHistory = userPredictionHistoryObject.results.slice();
                        $scope.name = authService.getName();
                        $scope.points = authService.getPoints();
                    }
                })
                .catch(function (err) {
                    console.log("Unable to fetch user prediction history. Details:\n" + err)
                })
        };

        var getUserGameHistory = function(userID){
            userService.getPredictionHistoryByPlayerID(authService.getToken(), userID)
                .then(function (response) {
                    if (!response || !response.data || !response.data.success) {
                        throw "There was an error trying to get user prediction history from the server. Please try again later";
                    }
                    var userPredictionHistoryObject = response.data;
                    if (userPredictionHistoryObject.results.length === 0) {
                        //show empty grid
                        console.info("Player prediction history is empty!");
                        $scope.gameHistory = [];
                    }
                    else {
                        $scope.gameHistory = userPredictionHistoryObject.results.slice();
                        $scope.name = userPredictionHistoryObject.user_name;
                        $scope.points = userPredictionHistoryObject.user_points;
                    }
                })
                .catch(function (err) {
                    console.log("Unable to fetch user prediction history for userID " + userID + " . Details:\n" + JSON.parse(err));
                })
        };

        $scope.getDisplayPoints = function (predicted_team_id, winning_team_id, game_weight)
        {
            if(winning_team_id === ""){
                return "[TBD]"
            }
            else{
                return (predicted_team_id == winning_team_id)? game_weight:"0";
            }
        }


        if(!$routeParams.id) {
            //this is token based, i.e. current user's account
            if ($scope.gameHistory.length == 0) { getMyGameHistory(); }
        }

        if($routeParams.id) {
            //fetch prediction history for user with userid
            getUserGameHistory($routeParams.id);
        }
    }
})();