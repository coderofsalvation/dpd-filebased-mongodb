(function() {

	var monkeypatch = require('monkeypatch')
  var mongo = false 

  // patch require()             
  monkeypatch( require('module').prototype,'require', function(original, modname ){
    if( modname == 'mongodb' ){
      if( !mongo ){
        console.log(process.cwd())
        mongo = original('mongo-mock')
        var MongoClient = mongo.MongoClient;
        var dbfile = process.env.MONGO_DB_FILE || "./data/mongodb.js";
        MongoClient.persist= dbfile 
        console.log("mongodb redirected to '"+dbfile+"'")
      }
      return mongo 
    } 
    return original(modname)
  }) 
  
})()
