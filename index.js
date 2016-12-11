(function(dirname,Collection) {

	var monkeypatch = require('monkeypatch')
  var debug = require('debug')('dpd-filebased-mongodb');
  var mongo = false 
  var ObjectId = false
  var instance = false

  // patch require()             
  monkeypatch( require('module').prototype,'require', function(original, modname ){

    // this patch will redirect mongodb to mongo-mock
    if( modname == 'mongodb' ){
      if( !mongo ){
        mongo = original('mongo-mock')
        mongo.max_delay = 0
        var MongoClient = mongo.MongoClient;
        var dbfile = process.env.MONGO_DB_FILE || process.cwd()+"/mongodb.js";
        MongoClient.persist= dbfile 
				try{
					require('fs').readFileSync(dbfile)
				}catch (e){
          console.log("COULD NOT OPEN "+dbfile)
					require('fs').writeFileSync(dbfile,"module.exports = {}")
				}
        MongoClient.load(dbfile)
        debug("mongodb redirected to '"+dbfile+"'")
        process.on('SIGINT', function () {
          console.log("saving db to "+process.env.MONGO_DB_FILE)
          mongo.MongoClient._persist()
        });
      }
      
      return mongo 
    } 

    // nasty fix for an edgecases with mongo-mock to make update() work
    if( modname == './collection.js' ){
      return function(dbname,server){
        var collection = original(modname)(dbname,server)  
        var update = collection.update 
        collection.update = function(){
          if( arguments.length == 5 && arguments[4] == false ){
            var args = Array.prototype.slice.call(arguments,0,-1)
            var cb = args[3]
            args[3] = function(err,result){
              cb( err, {result:result}) 
            }
            return update.apply({},args)
          }else return update.apply({}, arguments )
        }

				monkeypatch(collection,'find',function(originalFind){
					var args = []
					for( var i in arguments ) 
						if( i > 0 ) args[i-1] = arguments[i]
					if( args[1] == undefined ) args[1] = {}
					return originalFind.apply(this,args)
				})

        return collection
      }
    }

		// patch bson-objectid to support 16-char idstrings
    if( modname == 'bson-objectid' ){
      if( !ObjectId ){
        var o = original('bson-objectid')
        ObjectId = function(str){
          var str = String(arguments[0]).substr(0, 12)
          return o( str ).id
        }
      }
      return ObjectId
    }

		return original(modname)
  }) 
  
})(__dirname, require('deployd/lib/resources/collection'))
