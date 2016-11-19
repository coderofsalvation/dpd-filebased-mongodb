# BETA (not ready for production) 

run deployd without mongodb (but a jsonfile instead to store data)

<img src="https://media0.giphy.com/media/3o7TKDMPKsakcn9NU4/200.gif" width="150" style="width:150px"/>

## Usage 

   $ npm install dpd-filebased-mongodb mongo-mock --save

Now make sure you include it *before* deployd itself in your `app.js`:

		require('dpd-filebased-mongodb')      // <-- magic right there

		var deployd = require('deployd')
			, options = {port: 3000};
		var dpd = deployd(options);
		dpd.listen();

> That's it! Now your data is stored in `data/mongodb.js` 

## Why 

* Sometimes you want to use deployd for simple api's without the mongodb-requirement.
* Sometimes you want to test deployd with a fake mongodb

## Notes 

* to specify a different file, specify environment variable `MONGO_DB_FILE="data/foo.js"` etc
* it doesn't run *all* mongo-queries (see [mongo-mock](https://npmjs.org/package/mongomock)
* hiding fields doesn't always work (solution: put `if( this.password ) delete this.password` into event-code)
