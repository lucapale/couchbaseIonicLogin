angular.module('facebook.services', [])

.constant("FACEBOOK_APP_ID", "493333274104756")

.service('FBService', ['$q','$ionicLoading', '$filter', function($q,$ionicLoading,$filter) {

//for the purpose of this example I will store user data on ionic local storage but you should save it on a database
  var _this = this
	
  this.setUser = function(user_data) {
    window.localStorage['ionFB_user'] = JSON.stringify(user_data);
  };
  
  //this method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=location,birthday,email,id,first_name,gender,last_name,name,locale,timezone&access_token=' + authResponse.accessToken, null,
      function (response) {
        info.resolve(response);
      },
      function (response) {
        info.reject(response);
      }
    );
    return info.promise;
  }
  

  this.userIsLoggedIn = function(){
    var user = this.getUser();
	 if (user.authResponse)
    	 return user.authResponse.userID != null;
	 else 
		 return false
  };

  this.getUser = function(){
    return JSON.parse(window.localStorage['ionFB_user'] || false);
  };
  
//This is the success callback from the login method
  this.fbLoginSuccess = function(response) {
	  
    if (!response.authResponse){
      _this.fbLoginError("Cannot find the authResponse");
      return;
    }
   console.log('fbLoginSuccess');

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
    .then(function(profileInfo) {

      //log('profile info success', profileInfo);
      //for the purpose of this example I will store user data on local storage
      _this.setUser({
        authResponse : authResponse,
        profileInfo : profileInfo,
        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=square"
      });

      $ionicLoading.hide();
		
		//$(document).trigger('logged-in')
		config.login()
      
    }, function(fail){
      //fail get profile info
     console.log('profile info fail', fail);
    });
  };
  
  //This is the fail callback from the login method
  this.fbLoginError = function(error){
   console.log('fbLoginError',error);
    $ionicLoading.hide();
  };

  
  this.fbStartLogin = function(){
	  //ask the permissions you need. You can learn more about FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
	  facebookConnectPlugin.login(['email', 'public_profile','user_location', 'user_birthday', 'user_photos'], _this.fbLoginSuccess, _this.fbLoginError);
  }

  return this
}]);
