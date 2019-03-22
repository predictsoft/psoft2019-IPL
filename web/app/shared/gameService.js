/*
grjoshi 3/30/2016
     Service to handle all game-related API calls
*/

angular.module("psoftUI").service("gameService", function ($http) {


    var rem_predictions = 0;

    var predictionGrid = {
        enableColumnMenus: false,
        minRowsToShow: 17,
        columnDefs: [
            { field: 'href',
                displayName: 'Player',
                cellTemplate: '<div class="ngCellText"><a href="#!/profile?id={{row.entity.userID}}">{{row.entity.name}}</a></div>'
            },
            { field: 'PredictedTeam',
                displayName: 'Predicted Team'
            }
        ]
    };
    
    this.getPredictionStats = function(auth_token){
        //return rem_predictions;
        return $http.get("/api/v1/games/prediction/stats?access_token="+auth_token);
    };
    

    this.setRemainingPredictionCount = function(remP){
        rem_predictions = remP;
    };
    this.fillPredictionGrid = function(pred_data){
        predictionGrid.data = pred_data;
    };

    this.getPredictionGrid = function(){
        return predictionGrid;
    }

    this.getAllActiveMatches = function (auth_token) {
        return $http.get("/api/v1/games/active?access_token="+auth_token);
        
    };
    
    this.submitPrediction = function (auth_token, predObj) {
        
        var data = {
            predictionData : predObj                //array of predictions (if more than one active game)
        };
        return $http.post("/api/v1/games/predict?access_token="+auth_token, data);
    };
    
    this.showNextGamePredictions = function (auth_token) {
        return $http.get("/api/getPredictions?access_token="+auth_token);
    };
    
    this.getLeaderboardScores = function (auth_token) {
        return $http.get("/api/v1/scores?access_token="+auth_token);
    };
    
    this.getPredictionList = function (auth_token) {
        return $http.get("/api/v1/games/prediction?access_token="+auth_token);
    };
    
    this.checkIfUserPredicted = function (auth_token) {
        return $http.get("/api/checkIfPredicted?access_token="+auth_token);
    };
});