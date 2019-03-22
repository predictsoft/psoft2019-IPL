angular.module("psoftUI",['ngRoute','angular-md5','ui.grid','timer'])
	.config(function($routeProvider){
		$routeProvider
			.when('/poll',{
				controller: 			'pollController',
				templateUrl: 			'/web/app/components/poll/gamePollPartial.html',
				caseInsensitiveMatch: 	true
			})
			//.when('/user',{
			//	controller: 			'userController',
			//	templateUrl: 			'/app/views/profilePartial.html',
			//	caseInsensitiveMatch: 	true
			//})
			.when("/login",{
				controller: 			'loginController',
				templateUrl: 			'/web/app/components/login/loginPartial.html',
				caseInsensitiveMatch: 	true	
			})
			.when('/',{		//start with authentication service
				controller: 			'loginController',
				templateUrl: 			'/web/app/components/login/loginPartial.html',
				caseInsensitiveMatch: 	true
			})
			// .when('/',{
			// 	controller: 			'gameController',
			// 	templateUrl: 			'/web/app/components/poll/gamePollPartial.html',
			// 	caseInsensitiveMatch: 	true
			// })
			.when('/register',{
				controller: 			'registerController',
				templateUrl: 			'/web/app/components/register/registerPartial.html',
				caseInsensitiveMatch: 	true
			})
			.when('/profile',{
				controller: 			'profileController',
				templateUrl: 			'/web/app/components/profile/profilePartial.html',
				caseInsensitiveMatch: 	true
			})
			.when('/profile/:id',{
				controller:				'profileController',
				templateUrl: 			'/web/app/components/profile/profilePartial.html',
				caseInsensitiveMatch: 	true
			})
			.when('/rules',{
				controller:				'profileController',
				templateUrl:			'/web/app/components/rules/rulesPartial.html',
				caseInsensitiveMatch: 	true
			})
			.otherwise({
				template: "<H1>Page not found</H1>",
				//templateUrl: "/app/views/notFoundPartial.html",
				caseInsensitiveMatch: true
			});			
	});
