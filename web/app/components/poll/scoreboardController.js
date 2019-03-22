/*
grjoshi 5/30/2016
Controller that handles leaderboard view 
*/
(function () {
    angular.module("psoftUI").controller("scoreboardController", sbCtrl);
    sbCtrl.$inject = ['$scope', '$location', 'authService', 'gameService'];
    
    function sbCtrl($scope, $location,authService,gameService) {

        $scope.scoreGrid = {
            minRowsToShow: 17,
            enableColumnMenus: false,
            columnDefs: [{
                field: 'name',
                displayName: 'Player',
                width: "75%",
                cellTemplate: '<div class="ngCellText"><a href="#!/profile?id={{row.entity.userID}}">{{row.entity.name}}</a></div>'
            },
            {
                field: 'points',
                displayName: 'Score',
                width: "25%",
                enableSorting: false
            }]
        };

        //get leaderboard for scores
        gameService.getLeaderboardScores(authService.getToken())
            .then(function (response) {

                var scoreListObject = response.data;
                if (response == null) {
                    throw "There was an error trying to connect to the web service. Please try again later";
                }
                if (!scoreListObject || !scoreListObject.success) {
                     throw scoreListObject.message; 
                }
                if (scoreListObject.results.length === 0) {
                    $scope.scoreGrid = { data: '' };
                }
                else {
                    $scope.scoreGrid.data = scoreListObject.results;
                }
            })
            .catch(function (err) {
                if(err.data && err.data.message === "Token Expired"){
                    //expired token, redirecting to login
                    $location.path("/login");
                }
                return;
            })
	}
})();