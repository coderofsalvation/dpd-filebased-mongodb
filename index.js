(function(dirname, Collection) {

  var monkeypatch = require('monkeypatch')
  var debug = require('debug')('dpd-filebased-mongodb');
  var mongo = false 
  var ObjectId = false
  var instance = false
  var fs = require('fs')

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
          fs.readFileSync(dbfile)
          console.log("reading "+dbfile)
        }catch (e){
          console.log("creating "+dbfile)
          fs.writeFileSync(dbfile,"module.exports = {}")
        }
        MongoClient.load(dbfile)
      }
      
      return mongo 
    } 

    // nasty fix for mongo-mock edgecases 
    if( modname == './collection.js' ){

      return function(dbname,server){
        var mod = original(modname)
        collection = new mod(dbname,server)  
        var update = collection.update 

        // workaround for update() 
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

        // mongo-mock crashes on undefined find-arguments
        monkeypatch(collection,'find',function(originalFind){
          var args = []
          for( var i in arguments ) 
            if( i > 0 ) args[i-1] = arguments[i]
          if( args[1] == undefined ) args[1] = {}
          return originalFind.apply(this,args)
        })

        // mongo-mock remove() does not support '$in'
        monkeypatch(collection,'remove',function(originalRemove, selector, opts, callback){
          var args = []
          for( var i in arguments ) if( i > 0 ) args[i-1] = arguments[i]
          var selector = arguments[0]
          if( selector && selector._id && selector._id['$in'] ) {
            selector._id = selector._id['$in'].pop()
          }
          return originalRemove.apply(this,arguments)
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
  
})(__dirname, require('deployd/lib/resources/collection') )
