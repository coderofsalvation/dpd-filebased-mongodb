(function() {

	var monkeypatch = require('monkeypatch')

  // patch require()             
  monkeypatch( require('module').prototype,'require', function(original, modname ){
    if( modname == 'mongodb' ) modname = 'mongo-mock'
    return original(modname)
  }) 
  
})()
