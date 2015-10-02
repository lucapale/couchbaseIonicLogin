/*
 * This AngularJS factory is just a wrapper for all the RESTful API requests that
 * come packaged with the Couchbase Lite SDK.
 *
 * URL: http://developer.couchbase.com/mobile/develop/references/couchbase-lite/rest-api/index.html
 */
angular.module("ngCouchbaseLite", [])
.factory("$couchbase", ["$q", "$http", "$rootScope",function($q, $http, $rootScope) {

    this.databaseUrl = null;
    this.databaseName = null;

    /*
     * Construct a new Couchbase object given a database URL and database name
     *
     * @param    string databaseUrl
     * @param    string databaseName
     * @return   promise
     */
    var couchbase = function(databaseUrl, databaseName) {
        this.databaseUrl = databaseUrl;
        this.databaseName = databaseName;
    };

    couchbase.prototype = {

        /*
         * Create a new database with a name that was passed in from the constructor method
         *
         * @param
         * @return   promise
         */
        createDatabase: function() {
            return this.makeRequest("PUT", this.databaseUrl + this.databaseName);
        },
        /*
         * DELETE database with a name that was passed in from the constructor method
         *
         * @param
         * @return   promise
         */
        deleteDatabase: function() {
            return this.makeRequest("DELETE", this.databaseUrl + this.databaseName);
        },

        /*
         * Create a new design document with views
         *
         * @param    string designDocumentName
         * @param    object designDocumentViews
         * @return   promise
         */
        createDesignDocument: function(designDocumentName, designDocumentViews) {
            var data = {
                views: designDocumentViews
            };
            return this.makeRequest("PUT", this.databaseUrl + this.databaseName + "/_design/" + designDocumentName, {}, data);
        },
		  
        updateDesignDocument: function(designDocumentName, designDocumentViews) {
				var _this = this
           var data = {
               views: designDocumentViews
           };
				_this.getDesignDocument(designDocumentName).then(function(doc){
					if (!angular.equals(doc.views,designDocumentViews)) {
						doc.views = designDocumentViews
						return _this.makeRequest("PUT", _this.databaseUrl + _this.databaseName + "/_design/" + designDocumentName, {}, doc);
					} else {
						return true
					}
				})
        },

        /*
         * Get a design document and all views associated to insert
         *
         * @param    string designDocumentName
         * @return   promise
         */
        getDesignDocument: function(designDocumentName) {
            return this.makeRequest("GET", this.databaseUrl + this.databaseName + "/_design/" + designDocumentName);
        },
		  
        /*
         * Create a new local document
         *
         * @param    string designDocumentName
         * @param    object designDocumentViews
         * @return   promise
         */
		  
        createLocalDocument: function(localDocumentName, localDocument) {
            return this.makeRequest("PUT", this.databaseUrl + this.databaseName + "/_local/" + localDocumentName, {}, localDocument);
        },
        /*
         * Create a new local document
         *
         * @param    string designDocumentName
         * @param    object designDocumentViews
         * @return   promise
         */
		  
        deleteLocalDocument: function(localDocumentName, localDocumentRev) {
            return this.makeRequest("DELETE", this.databaseUrl + this.databaseName + "/_local/" + localDocumentName, {rev: localDocumentRev});
        },
		  
        /*
         * Update facebook token
         *
         * @param    string designDocumentName
         * @param    object designDocumentViews
         * @return   promise
         */
		  
        updateFBToken: function(token) {
			  return this.makeRequest("POST", this.databaseUrl + "_facebook_token", {}, token)
        },
        /*
         * Get Sync_Gateway session cookie
         *
         * @param    string designDocumentName
         * @param    object designDocumentViews
         * @return   promise
         */
		  
        getSessionCookie: function(token) {
			  return this.makeRequest("POST", config.REMOTE_URL + "/_session", {}, token)
        },
        /*
         * Get a design document and all views associated to insert
         *
         * @param    string designDocumentName
         * @return   promise
         */
        getLocalDocument: function(localDocumentName) {
            return this.makeRequest("GET", this.databaseUrl + this.databaseName + "/_local/" + localDocumentName);
        },

        /*
         * Query a particular database view
         *
         * @param    string designDocumentName
         * @param    string viewName
         * @param    object options
         * @return   promise
         */
        queryView: function(viewName, options) {
            return this.makeRequest("GET", this.databaseUrl + this.databaseName + "/_design/" + config.designDocName + "/_view/" + viewName, options)
        },

        /*
         * Create a new database document
         *
         * @param    object jsonDocument
         * @return   promise
         */
        createDocument: function(jsonDocument) {
            return this.makeRequest("POST", this.databaseUrl + this.databaseName, {}, jsonDocument);
        },
        /*
         * Update a database document
         *
         * @param    object jsonDocument
         * @return   promise
         */
        updateDocument: function(documentId, jsonDocument) {
            return this.makeRequest("PUT", this.databaseUrl + this.databaseName + "/" + documentId, {}, jsonDocument);
        },

        /*
         * Delete a particular document based on its id and revision
         *
         * @param    string documentId
         * @param    string documentRevision
         * @return   promise
         */
        deleteDocument: function(documentId, documentRevision) {
            return this.makeRequest("DELETE", this.databaseUrl + this.databaseName + "/" + documentId, {rev: documentRevision});
        },

        /*
         * Get all documents from the database
         *
         * @param
         * @return   promise
         */
        getAllDocuments: function() {
            return this.makeRequest("GET", this.databaseUrl + this.databaseName + "/_all_docs");
        },

        /*
         * Get a document from the database
         *
         * @param    string documentId
         * @return   promise
         */
        getDocument: function(documentId) {
            return this.makeRequest("GET", this.databaseUrl + this.databaseName + "/" + documentId);
        },
		  
        /*
         * Get a document from the database
         *
         * @param    string documentId
         * @return   promise
         */
        getAttachment: function(documentId,attachmentName) {
			  return this.databaseUrl + this.databaseName + "/" + documentId + "/" + attachmentName
        },
		  
        /*
         * Replicate in a single direction whether that be local to remote or remote to local
         *
         * @param    string source
         * @param    string target
         * @param    boolean continuous
         * @return   promise
         */
        replicate: function(source_url, target_url, continuous, auth) {
			  var settings
			  if (target_url.indexOf("http")!=-1) {
			  		//replication from local to remote
				  settings = {
					  source: source_url, 
					  target: {
							  url: target_url
						  }, 
					  continuous: continuous
				  }
				  if (auth) {				  
				  		settings.target.auth = auth
				  }
			  } else {
			  		//replication from remote to local
				  settings = {
					  source: {
							  url: source_url
						  }, 
					  target: target_url, 
					  continuous: continuous
				  }
				  if (auth) {				  
				  		settings.source.auth = auth
				  }
			  }
           return this.makeRequest("POST", this.databaseUrl + "_replicate", {}, settings);
        },

        /*
         * Continually poll the database for changes that include replications from a remote source
         *
         * @param
         * @return
         */
        listen: function() {
			   var _this = this
			   console.log("db listen")
				//set last sync
				var last_cseq = window.localStorage['last_cseq']
				if (!last_cseq) {
					window.localStorage['last_cseq'] = 0
					last_cseq = window.localStorage['last_cseq']
				}
            var poller = function(databaseUrl, databaseName, cseq) {
	            var settings = {
	                method: "GET",
	                url: databaseUrl + databaseName + "/_changes",
	                withCredentials: true,
						 params: {feed: "longpoll", since: cseq}
	            };
               $http(settings).then(function(result) {
                    //log("result",cseq,result)
						  for(var i = 0; i < result.data.results.length; i++) {
			              if(result.data.results[i].hasOwnProperty("deleted") && result.data.results[i].deleted === true) {
								  $rootScope.$broadcast("couchbase:deleted");
			              } else {
								  var id = result.data.results[i].id
								  if (id) {
							        _this.getDocument(id).then(function(doc){
										  //broadcast type
										  $rootScope.$broadcast("couchbase:change:" + doc.type);
										  $rootScope.$broadcast("couchbase:updating");
										 console.log("couchbase:change:" + doc.type)
										  //log("document",doc.type)
							        },function(error){
							        		console.log("document error",error)
							        }).catch(function (error) {
									     console.log("document error",error)
									  })
								  }
			              }
						  }
						  $rootScope.$broadcast("couchbase:connected");
						  if (result.data.last_seq)
						  		window.localStorage['last_cseq'] = result.data.last_seq
                    setTimeout(function() {
                        poller(databaseUrl, databaseName, result.data.last_seq);
                    }, 10);
                }, function(error) {
                   console.log("POLLING ERROR -> " + JSON.stringify(error));
                });
            };
            poller(this.databaseUrl, this.databaseName, last_cseq);
        },

        /*
         * Make a RESTful request to an endpoint while providing parameters or data or both
         *
         * @param    string method
         * @param    string url
         * @param    object params
         * @param    object data
         * @return   promise
         */
        makeRequest: function(method, url, params, data, getHeaders) {
            var deferred = $q.defer();
            var settings = {
                method: method,
                url: url,
                withCredentials: true
            };
				
            if(params) {
                settings.params = params;
            }
            if(data) {
                settings.data = data;
            }				 
            $http(settings)
                .success(function(result, status, headers, config) {
						 //log("headers",status,headers(),config)
						 if (getHeaders) {
							 var headers_obj = {}
						 	getHeaders.forEach(function(header){
						 		headers_obj[header] = headers(header)
						 	})
							deferred.resolve({
								headers: headers_obj,
								body: result
							});
						 } else {
						 	deferred.resolve(result);
						 }
                })
                .error(function(error, status) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

    };

    return couchbase;

}]);
