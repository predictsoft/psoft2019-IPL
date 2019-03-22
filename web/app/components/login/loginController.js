(function () {
    angular.module("psoftUI").controller("loginController", loginCtrl);
    loginCtrl.$inject = ['$scope', '$location', 'authService', 'userService', 'md5'];
    function loginCtrl($scope, $location, authService, userService, md5) {

        $scope.is_valid = true;
        $scope.message = "";
        $scope.is_waiting = false;			//enabled when waiting on server
        
        //console.log("AUTH_INIT: checking auth object::" + angular.toJson(authService.usrObj));
        if (!authService.isLoggedIn()) {
            if (authService.loadSession()) {
                //fetch and update score if different from session storage
                userService.getUserPoints(authService.getToken())
                    .then(function (response) {
                        if (response && response.data && response.data.points) {
                            if (authService.usrObj.points != response.data.points) {
                                //update score and storage object
                                authService.usrObj.points = response.data.points;
                                authService.saveSession(authService.usrObj);      //update score in saved session
                            }
                        }
                    });
                //user info loaded; redirect to main page
                $location.path("/poll");
            }
            else {
                //no session saved either, so wait on login
                //console.log("First time run - waiting on login...");
             }
        }
/*        else {
            // $scope.user.userID = authService.usrObj.userID;
            // $scope.user.name = authService.usrObj.name;
            // $scope.user.email = authService.usrObj.email;
            // $scope.user.token = authService.usrObj.token;
            // $scope.user.points = authService.usrObj.points;
            $scope.user = authService.usrObj.slice();
            console.log("DOES THIS EVER GET HERE???");
            $location.path("/poll");
        }*/

        $scope.checkIfLoggedIn = function () {
            return authService.isLoggedIn();
        };

        $scope.getUserName = function() {
            // if(authService)
            //     return authService.usrObj.name;
            // else
            //     return '404';
            return authService.getName();
        };

        $scope.getUserFirstName = function(){
            return authService.getFirstName();
        }

        $scope.getUserPoints = function() {
            // if(!authService)
            //     return '';
            //     return authService.usrObj.points;
            return authService.getPoints();
        }

        $scope.login = function () {
            
            //check if already logged in
            if (authService.isLoggedIn()) {
                //console.log("Already logged in as "+userService.usrObj.name);
                $location.path("/poll");
                return;
            }
            $scope.is_waiting = true;
            authService.login($scope.email, md5.createHash($scope.password))
			.then(function (response) {
                if (response == null) {
                    throw "There was an error trying to connect to the web service. Please try again later";
                }
                
                if (!response.data.success) {
                    throw response.data.message;
                }
                /* authService.usrObj = {
                    ID      : response.data.user_data.userID,
                    name    : response.data.user_data.user,
                    email   : response.data.user_data.email,
                    points  : response.data.user_data.points
                }; */
                
                delete response.data.success;

                authService.usrObj = angular.copy(response.data);
                //$scope.user = angular.copy(response.data.usrData);

                if ($scope.savelogin) {
                    authService.saveSession(response.data);
                }
                
                $scope.is_valid = true;
                $location.path("/poll");
                return;
            })
			.catch(function (err) {
                //console.log("FAILED finding user. Response was:"+response.status, response.data);
                $scope.message = err;
                $scope.is_valid = false;
                console.log(err);
            })
			.finally(function () {
                //$location.path("/poll");
                //return;
                $scope.is_waiting = false;
            })
        };

        $scope.logout = function () {
            //invalidate user session
            console.log("Erasing user session...");
            authService.clearAuth();
            $location.path("/login");
        };


        $scope.redirectToRegister = function () {
            $location.path("/register");
            return;
        };
    }
})();