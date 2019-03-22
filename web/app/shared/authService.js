/*
 grjoshi 5/24/2016
 Authentication factory to hold user object
 */

angular.module("psoftUI").factory('authService', function ($http){
    var session_name = 'nofapp2_session';
    var usrObj = {
        ID      : '',
        email   : '',
        name    : '',
        token   : '',
        points  : 0
    };

    usrObj.login = function(email, passwordHash){
        var loginData = {
            email: email,
            password: passwordHash
        };

        return $http.post('/api/login', loginData);
    };

    usrObj.saveSession = function (psoftData){
        //save current user object and token in session storage
        if(psoftData && psoftData.success) {
            delete psoftData.success;
        }
        window.localStorage[session_name] = angular.toJson(psoftData);
    };

    usrObj.loadSession = function () {
        //check local storage for login, and return true if found
        if (window.localStorage[session_name] && window.localStorage[session_name]!=="undefined") {
            this.usrObj = angular.fromJson(window.localStorage[session_name]);
            return true;
        }
        else
            return false;
    };

    usrObj.isLoggedIn = function(){
        if(!this.usrObj || !this.usrObj.auth_data){
            return false;
        }
        else{
            return true;
        }
    };

    usrObj.getName = function(){
        if(this.usrObj)
            return this.usrObj.user_data.name;
    };
    
    usrObj.getUserID = function(){
        if(this.usrObj)
            return this.usrObj.user_data.userID;
    };

    usrObj.getFirstName = function(){
        if(this.usrObj)
            return this.usrObj.user_data.first_name;
    };


    usrObj.getPoints = function(){
        if(this.usrObj)
            return this.usrObj.user_data.points;
    };

    usrObj.getToken = function () {
        if(!this.usrObj){
            return '';
        }
        else
            return this.usrObj.auth_data.token;
    };

    usrObj.clearAuth = function(){
        window.localStorage.clear();
        this.usrObj = {
            userID: '',
            email: '',
            name: '',
            token: '',
            points: 0
        };
    };

    return usrObj;

});
