
/*
grjoshi 3/30/2016
     Service to handle user session object and all user-related API calls
*/

angular.module("psoftUI").service("userService", function ($http){
	// this.usrObj = {
	// 	userID: '',
	// 	email: '',
	// 	name: '',
     //    token: '',
	// 	points: 0
	// };	
    
    //
    // this.checkSession = function () {
    // //check local storage for login, and return true if found
    //     if (window.localStorage['nofapp_session']) {
    //         //console.log("User session is available as:" + angular.toJson(window.localStorage['nofapp_session']));
    //         this.usrObj = angular.fromJson(window.localStorage['nofapp_session']);
    //         //console.log("Loaded:: " + angular.toJson(this.usrObj, true));
    //         return true;
    //     }
    //     else {
    //         return false;
    //     }
    // };


    this.getUserPoints = function (auth_token) {
        return $http.get("/api/v1/player/points?access_token=" + auth_token);
    };

    //
    ////reassigned to authservice
    //
    // this.checkLogin=function(){
    //
    //     if (this.usrObj.token == '')			//use token to check if user is logged in
    //         return false;
    //     else
    //         return true;
    // }

    
    // this.login = function (email, password) {
    //     var data = {
    //         email: email,
    //         password: password
    //     };
    //
    //     var promise = $http.post("/api/login", data);
    //     return promise;
    // }
    
    this.addUser = function (name, email, password, token) {
        var data = {
            name    : name,
            password: password,
            email   : email,
            token   : token
        };
        
        return $http.post("/api/register", data);
    };
    
    this.getPredictionHistory = function (token) {
        return $http.get("/api/getHistory?token=" + token);
    };

    this.getPredictionHistoryByPlayerID = function(auth_token, userID){
        return $http.get("/api/v1/player/"+userID+"/history?access_token=" + auth_token);
    }
});
