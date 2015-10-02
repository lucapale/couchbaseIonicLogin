var couchbaseApp = angular.module('starter', ['ionic', 'ngIOS9UIWebViewPatch', 'ngCouchbaseLite', 'Config', 'facebook.services'])

var divePlanDatabase = null, config = null;

couchbaseApp.run(function($ionicPlatform,$couchbase,$config) {
    $ionicPlatform.ready(function() {
        // 1
        if(!window.cblite) {
            alert("Couchbase Lite is not installed!");
        } else {
		  	
            cblite.getURL(function(err, url) {
                if(err) {
                    alert("There was an error getting the database URL");
                    return;
                }
			       // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
			       // for form inputs)
			       if(window.cordova && window.cordova.plugins.Keyboard) {
			         cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			  		 	cordova.plugins.Keyboard.disableScroll(true);
			       }
			       if(window.StatusBar) {
			  			StatusBar.styleLightContent();
			  			StatusBar.isVisible = false;
					 }
					 
					 config = new $config();
                divePlanDatabase = new $couchbase(url, config.databaseName);
					 config.startDB()
                
             });
         }
    });
})


couchbaseApp.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state("login", {
            url: "/login",
            templateUrl: "templates/login.html",
            controller: "LoginController"
        })
        .state("todoLists", {
            url: "/todoLists",
            templateUrl: "templates/todolists.html",
            controller: "TodoListsController"
        })
        .state("tasks", {
            url: "/tasks/:listId",
            templateUrl: "templates/tasks.html",
            controller: "TaskController"
        });
    $urlRouterProvider.otherwise("/login");
});

couchbaseApp.controller("LoginController", function($scope, $state, $ionicHistory) {

    $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
    });

	 $scope.basicLogin = function() {
		 config.guestLogin()
	 };
	 $scope.fbLogin = function() {
      config.login()
	 };

});

couchbaseApp.controller("TodoListsController", function($scope, $state, $ionicPopup, $couchbase, $rootScope) {

    $scope.lists = {};

    $rootScope.$on("couchbase:change", function(event, args) {
        for(var i = 0; i < args.results.length; i++) {
            if(args.results[i].hasOwnProperty("deleted") && args.results[i].deleted === true) {
                delete $scope.lists[args.results[i].id];
            } else {
                if(args.results[i].id.indexOf("_design") === -1) {
                    divePlanDatabase.getDocument(args.results[i].id).then(function(result) {
                        if(result.type === "list") {
                            $scope.lists[result._id] = result;
                        }
                    });
                }
            }
        }
    });

    divePlanDatabase.queryView("_design/todo", "lists").then(function(result) {
        for(var i = 0; i < result.rows.length; i++) {
            $scope.lists[result.rows[i].id] = result.rows[i].value;
        }
    }, function(error) {
        console.log("ERROR QUERYING VIEW -> " + JSON.stringify(error));
    });

    $scope.insert = function() {
        $ionicPopup.prompt({
            title: 'Enter a new TODO list',
            inputType: 'text'
        })
        .then(function(result) {
            if(result != "") {
                var obj = {
                    title: result,
                    type: "list",
                    owner: "guest"
                };
                divePlanDatabase.createDocument(obj).then(function(result) {
                    console.log("Document " + result.id + " created!");
                }, function(error) {
                    console.log("ERROR: " + JSON.stringify(error));
                });
            }
        });
    }

    $scope.delete = function(list) {
        var listId = list._id;
        divePlanDatabase.deleteDocument(list._id, list._rev).then(function(result) {
            divePlanDatabase.queryView("_design/todo", "tasks", {"start_key": listId}).then(function(result) {
                for(var i = 0; i < result.rows.length; i++) {
                    divePlanDatabase.deleteDocument(result.rows[i].id, result.rows[i].value.rev);
                }
            }, function(error) {
                console.log("ERROR QUERYING VIEW -> " + JSON.stringify(error));
            });
        }, function(error) {
            console.log("ERROR -> " + JSON.stringify(error));
        });
    }

});

couchbaseApp.controller("TaskController", function($scope, $rootScope, $stateParams, $ionicPopup, $ionicHistory, $couchbase) {

    $scope.todoList = $stateParams.listId;
    $scope.tasks = {};

    $rootScope.$on("couchbase:change", function(event, args) {
        for(var i = 0; i < args.results.length; i++) {
            if(args.results[i].hasOwnProperty("deleted") && args.results[i].deleted === true) {
                delete $scope.tasks[args.results[i].id];
            } else {
                if(args.results[i].id.indexOf("_design") === -1) {
                    divePlanDatabase.getDocument(args.results[i].id).then(function(result) {
                        if(result.type === "task") {
                            $scope.tasks[result._id] = result;
                        }
                    });
                }
            }
        }
    });

    divePlanDatabase.queryView("_design/todo", "tasks", {"start_key": $stateParams.listId}).then(function(result) {
        for(var i = 0; i < result.rows.length; i++) {
            $scope.tasks[result.rows[i].id] = {"_id": result.rows[i].id, "title": result.rows[i].value.title, "list_id": result.rows[i].value.list_id, "_rev": result.rows[i].value.rev};
        }
    }, function(error) {
        console.log("ERROR QUERYING VIEW -> " + JSON.stringify(error));
    });

    $scope.insert = function() {
        $ionicPopup.prompt({
            title: 'Enter a new TODO task',
            inputType: 'text'
        })
        .then(function(result) {
            if(result != "") {
                var obj = {
                    title: result,
                    type: "task",
                    list_id: $stateParams.listId,
                    owner: "guest"
                };
                divePlanDatabase.createDocument(obj).then(function(result) {
                    console.log("Document " + result.id + " created!");
                }, function(error) {
                    console.log("ERROR: " + JSON.stringify(error));
                });
            }
        });
    }

    $scope.delete = function(task) {
        divePlanDatabase.deleteDocument(task._id, task._rev);
    }

    $scope.back = function() {
        $ionicHistory.goBack();
    }

});
