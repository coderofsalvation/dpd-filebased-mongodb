(function(dirname,Collection) {

	var monkeypatch = require('monkeypatch')
  var mongo = false 
  var ObjectId = false

  // patch require()             
  monkeypatch( require('module').prototype,'require', function(original, modname ){
    if( modname == 'mongodb' ){
      if( !mongo ){
        mongo = original('mongo-mock')
        mongo.max_delay = 0
        var MongoClient = mongo.MongoClient;
        var dbfile = process.env.MONGO_DB_FILE || "data/mongodb.js";
        MongoClient.persist= dbfile 
				try{
					require(dbfile)
				}catch (e){
					require('fs').writeFileSync(dbfile,"module.export = {}")
				}
				MongoClient.load(dbfile)
        console.log("mongodb redirected to '"+dbfile+"'")
      }
      return mongo 
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

		// patch find
		if( modname == './collection.js' ){
			var o = original(modname)
			return function( db, state ){
				var v = o(db,state)
				monkeypatch(v,'find',function(originalFind){
					var args = []
					for( var i in arguments ) 
						if( i > 0 ) args[i-1] = arguments[i]
					if( args[1] == undefined ) args[1] = {}
					return originalFind.apply(this,args)
				})
				return v
			}
		}
    
		return original(modname)
  }) 
  
})(__dirname, require('deployd/lib/resources/collection'))
