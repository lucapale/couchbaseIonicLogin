angular.module("Config", [])
.factory("$config", ["$q", "$http", "$rootScope", "$state", "FBService","$ionicLoading",function($q, $http, $rootScope, $state,FBService,$ionicLoading) {

    /*
     * Construct a new Login object
     *
     * @return   promise
     */
 	 window.isOnLine = true
	
    var config = function() {
        this.databaseName = "diveplan_v1";
        this.designDocName = "diveplan";
        this.REMOTE_SERVER = "http://62.149.229.141:4984";
        this.REMOTE_DB = "diveplanapp";
        this.REMOTE_URL = this.REMOTE_SERVER+"/"+this.REMOTE_DB;
		  this.user = null
		  this.diveplanViews =  {
				profile_private : {
					map : function(doc,meta)
					{
						if (doc.type == "profile" && doc.name) {
							if (doc._deleted || (meta && meta.id.indexOf("_sync")!=-1)) {
								//niente
							} else {
								emit(doc.name, {
									fbUserID: doc.id
								})
							}
						}
					}.toString()
				}
			}		
    };

    config.prototype = {

        /*
         * @param
         * @return   promise
         */
		 startDB: function(fbLogin) {
			 var _this = this
          // check if database is existing
			 divePlanDatabase.getDesignDocument(_this.designDocName).then(function(ok) {
             //database exists
				console.log("database existing",divePlanDatabase)
				 divePlanDatabase.listen();
				 //update design document if changeda
				 divePlanDatabase.updateDesignDocument(_this.designDocName, _this.diveplanViews)
				 
				 divePlanDatabase.getLocalDocument("user").then(function(user) {
					 _this.user = user
					 if (user.guest) {
					 	_this.guestLogin()
					 } else {
					 	_this.login()
					 }
             },function(err) {
				  if (fbLogin) {
				  	   _this.login()
				  } else {
				  		$state.go('login')
				  }
             })
          }, function(error) {
             // no database exisiting
             divePlanDatabase.createDatabase().then(function(result) {
                 divePlanDatabase.createDesignDocument(_this.designDocName, _this.diveplanViews);
					 console.log("database created",divePlanDatabase)
                 divePlanDatabase.listen();
					  $ionicLoading.hide()
					  if (fbLogin) {
					  	   _this.login()
					  } else {
					  		$state.go('login')
					  }
             }, function(error) {
                 // There was an error creating the database
             });
          });
		 },
		 guestLogin: function() {
			 var _this = this
			 if (_this.user) {
				 //existing guest logi
				 guestReplicate()
			 } else {
				 //new guest login
				 _this.user = {
					 guest: true
				 }
		       divePlanDatabase.createLocalDocument("user",_this.user).then(function(result) {
		 			console.log("guest_user",result)
					 guestReplicate()
		       }, function(error) {
		           // Document creation 
		 			console.log("guest_user error",error)
		       });
			 }
			 
			 function guestReplicate() {
				_this.replicateDatabase().then(function(ok){
					console.log("replicateDatabase guest",ok)
					$ionicLoading.hide()
					$state.go('todoLists')
				}, function(err){
					console.log("replicateDatabase guest err",err)
				})
			 }
	       
		 },
		 login: function() {
			 var _this = this
	       facebookConnectPlugin.getLoginStatus(function(success){
	 	       if(success.status === 'connected'){
					 var user_data =  FBService.getUser()
					  //update access token
					 user_data.authResponse.accessToken = success.authResponse.accessToken
					 FBService.setUser(user_data)
					
	 	          // the user is logged in and has authenticated your app, and response.authResponse supplies
	 	          // the user's ID, a valid access token, a signed request, and the time the access token
	 	          // and signed request each expire
	 	          //console.log('getLoginStatus success',success.status);
		 		 	/*
		 		 	Get user email address from Facebook, and access code to verify on Sync Gateway
		 		 	*/
		 		 	_this.user = user_data.profileInfo
		 		 	_this.user.access_token = user_data.authResponse.accessToken;
		 		 	_this.user.user_id= _this.user.email
		 		   //console.log("login",_this.user)
		 			//check and ask user email
		 			if (!_this.user.email) {
		 				_this.requestEmail("Please insert your email address for registration.")
		 			} else {
		 				_this.checkUser().then(function(res){
		 					//replicated DB
		 					_this.replicateDatabase().then(function(ok){
		 						console.log("replicateDatabase",ok)
								$ionicLoading.hide()
		 						$state.go('todoLists')
		 					}, function(err){
		 						console.log("replicateDatabase err",err)
		 					})
		 				}, function(err){
		 					console.log("checkUser err",err)
		 				})
		 			}
	 	       } else {
	 	          //if (success.status === 'not_authorized') the user is logged in to Facebook, but has not authenticated your app
	 	          //else The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
	 	         console.log('getLoginStatus login',success.status);
	 	          $ionicLoading.show({
	 	            template: 'Logging in...'
	 	          });
				 
	 	          //ask the permissions you need. You can learn more about FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
	 				 FBService.fbStartLogin()		        
	 			 }
	       });
		 },
		 fbLogin: function() {
			 //reset database and login with facebook after user guest
			 var _this = this
          divePlanDatabase.deleteDatabase().then(function(result) {
              _this.user = null
				 FBService.setUser(null)
				  _this.startDB(true)
          }, function(error) {
              // There was an error deleting the database
          });
		 },
		 logout: function() {
			 var _this = this
          // check if database is existing
          facebookConnectPlugin.logout(function(){
            //success
             divePlanDatabase.deleteDatabase().then(function(result) {
					console.log("delete db",result)
                 _this.user = null
					 FBService.setUser(null)
					  _this.startDB()
             }, function(error) {
                 // There was an error deleting the database
             });
          },
          function(fail){
            $ionicLoading.hide();
          });
		 },
		 requestEmail: function(message) {
			var emailCheck=/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
			var email = prompt(message, "");
			if (emailCheck.test(email)) {
				var user_data =  FBService.getUser()
				 user_data.profileInfo.email = email
				 FBService.setUser(user_data)
				this.login()
			} else {
				requestEmail("Not a valid email address! Please enter a valid email address.")
			}
		 },
		 checkUser: function() {
			 var deferred = $q.defer();
			 var _this = this
 		 	//check if user is already registered in the database
 		   divePlanDatabase.getLocalDocument("user").then(function(local_user) {
 		    	console.log("local_user",local_user)
				//register token
 				_this.registerFacebookToken().then(function(ok) {
 					console.log("fbtoken res",ok)
	 				deferred.resolve(local_user);
 				}, function(error) {
 					// There was an error replicating to the local device
 					console.log("registerFacebookToken error",error)
 					deferred.reject(error);
 				});
 		   }, function(err){
 		    	console.log("local_user non existing",err)
 		 		//create user
 		       divePlanDatabase.createLocalDocument("user",_this.user).then(function(result) {
 		 			console.log("local_user",result,_this.user)
 		           // Document created successfully
					 //create user profile
	 				_this.registerFacebookToken().then(function(ok) {
	 					console.log("fbtoken res",ok)
		 				_this.createMyProfile().then(function(profile) {
		 					console.log("profile created",profile)
		 					deferred.resolve(profile);
		 				}, function(error) {
		 					// There was an error replicating to the local device
		 					console.log("createMyProfile error",error)
		 					deferred.reject(error);
		 				});
	 				}, function(error) {
	 					// There was an error replicating to the local device
	 					console.log("registerFacebookToken error",error)
	 					deferred.reject(error);
	 				});
 					
 		       }, function(error) {
 		           // Document creation 
 		 			console.log("local_user error",error)
 					 deferred.reject(error);
 		       });
 		   });
 			return deferred.promise;
		 },
		 createMyProfile : function() {
				var _this = this
				//console.log("createMyProfile user "+JSON.stringify(config.user))
				var profileData = angular.copy(_this.user)
				profileData.type = "profile"
				profileData.user_id = profileData.email
				delete profileData.email
				//console.log("createMyProfile", profileData)
			   return divePlanDatabase.updateDocument("p:"+profileData.user_id, profileData)
		 },
		 registerFacebookToken : function() {
				var _this = this
				_this.registerData = {
					remote_url : _this.REMOTE_SERVER,
					email : _this.user.email,
					access_token : _this.user.access_token
				}
				console.log("registerFacebookToken",_this.registerData)
				return divePlanDatabase.updateFBToken(_this.registerData)
		 },
		 replicateDatabase: function() {
			 var deferred = $q.defer();
			 var _this = this
			//replicate local to remote
		    var auth = false
			 if (_this.user && _this.user.email) {
			 	auth = {facebook : {email : _this.user.email}}
			 }
			divePlanDatabase.replicate(_this.databaseName, _this.REMOTE_URL , true, auth).then(function(result1) {
				console.log("replicate local to remote",_this.databaseName,result1)
				//replicate remote to local
				divePlanDatabase.replicate(_this.REMOTE_URL, _this.databaseName, true, auth).then(function(result2) {
					console.log("replicate remote to local",result2)
					
					 _this.showToast("Downloading data from main database...", "short", "bottom")
					
					deferred.resolve(result2);
				}, function(error) {
					// There was an error replicating to the local device
					console.log("replicate error",error)
					deferred.reject(error);
				});
			}, function(error) {
				// There was an error replicating to the Sync Gateway
				console.log("replicate error",error)
				deferred.reject(error);
			});
			return deferred.promise;
		 },
		 showToast: function(message, duration, location) {
		       //removed
		   }
    };
    return config;
 }]);