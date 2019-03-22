/*
grjoshi 5/30/2016
Controller that retrieves prediction list for current match from submitted entries
*/
(function () {
    angular.module("psoftUI").controller("predListController", plCtrl);
    plCtrl.$inject = ['$scope', '$location','authService','gameService'];
    
    function plCtrl($scope, $location,authService,gameService) {

        $scope.lockDown = false;
        $scope.user_token = authService.getToken();
        $scope.predictionGrid = gameService.getPredictionGrid();
        $scope.predictionData = {};
        $scope.predictionsRemaining = 0;
       /*$scope.predictionGrid = {
            enableColumnMenus: false,
            columnDefs: [
                { field: 'href',
                    displayName: 'Name',
                    cellTemplate: '<div class="ngCellText"><a href="/src/index.html#/profile?id={{row.entity.uid}}">{{row.entity.Name}}</a></div>'
                },
                { field: 'Team',
                    displayName: 'Predicted Team'
                }]
        };*/

        //quick hack for semi and finals:
        if ($scope.lockDown) {
            $scope.predictionGrid = { data: '' };		//comment to show prediction grid
            return;
        }

        //get Prediction from API
        gameService.getPredictionList($scope.user_token)
        .then(function (response) {
            if (!response || !response.data || !response.data.success) {
                throw "There was an error trying to fetch prediction data from the web service. Please try again later";
            }
            $scope.predictionData = response.data.results;
           //gameService.setRemainingPredictionCount(response.data.rem_predictions);
            gameService.fillPredictionGrid($scope.predictionData);      //for dynamically refreshing the prediction grid

            //also fetch/refresh number of prediction(s) remaining
            return gameService.getPredictionStats($scope.user_token);
        })
        .then(function(predictionStatsObject){
            var predictionStats = predictionStatsObject.data.results[0];

            $scope.predictionsRemaining = predictionStats.total_players - predictionStats.predictions_received;
        })
        .catch(function (err) {
            if(err.data && err.data.message === "Token Expired"){
                //expired token, redirecting to login
                $location.path("/login");
            }
            console.error("Unable to fetch prediction table. Details:\n" + err);
        });

        $scope.filterPredictionList = function(selectedMatchItem){
           
            if(!selectedMatchItem){
                gameService.fillPredictionGrid($scope.predictionData);
                return;
            }
            var gameObject = JSON.parse(selectedMatchItem || {});
            var filtered_list = $scope.predictionData && $scope.predictionData.filter(
                                game=>((game.gameID === gameObject.MatchID))
                            );

            gameService.fillPredictionGrid(filtered_list);
        }
    }


})();