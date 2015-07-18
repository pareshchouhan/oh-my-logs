var express = require('express'),
	fs = require('fs'),
	app = express(),
	lessMiddleware = require('less-middleware'),
	_ = require('underscore')
	assert = require('assert'),
	path = require('path'),
	regexp = require('node-regexp'),
	morgan = require('morgan');

//Require config.js, check config.js for minimal configuration.
var config = require('./config.js');
var checkDrives = /([A-Za-z]):.*/;

// Development Only
// Log format : 'tiny' , 'short', 'dev', 'common', 'combined' (Apache)
if ( 'development' == app.get('env') ) {
	app.use( morgan('tiny') );
}



//Middle ware are called in order , so lessMiddleWare is called before express.static.
//For adding more security write your own middleware before static.
//User static file serving middleware.
//app.use(lessMiddleware(__dirname + '/public'));
//app.use(express.static(path.join(__dirname, 'public')));

//Set template engine to jade.
app.set('views', path.join(__dirname, '/public/templates'));
app.set('view engine', 'jade');

var port = process.env.PORT || config.port || 1080;

app.listen(port,function(err)	{
	if(err)	console.log(err);
	console.log('Listening on ' + port);
});

//Handle request on '/'
app.get('/',function(req,res){

	if(req.query.dir != null)	{
		//badwords check, edit config.js to edit the list of badwords.
		for(word in config.badWords)	{
			var badWordRegex = regexp();
			badWordRegex.must(config.badWords[word]);
			badWordRegex = badWordRegex.toRegExp();	
		}
	}	
	
	//general checks on dir and badwords and if the user is trying to access drives like "/?dir=C:\" etc.
	if(req.query.dir == null || req.query.dir == "" || req.query.dir.match(badWordRegex) || req.query.dir.match(checkDrives))	{
		fs.readdir('./',function(err,files){
			if(err)	res.end(err.toString());
			//Replace last called thingy.
			var uppath = req.originalUrl.replace(req.originalUrl.split("/")[req.originalUrl.split("/").length - 1],"");
			//Render jade page.
			res.render('index', {pageTitle : config.pageTitle, 
				dataDir : files, 
				path : req.path + '?dir=.',
				upPath : uppath
			});
		});	
	}
	else {
		var fileExtensionCheck = false;
		//File Extension check.
		for(extension in config.fileMatch)	{
			if(req.query.dir.match(regexp().end(config.fileMatch[extension]).toRegExp()))	{
				fileExtensionCheck = true;
			}
		}

		if(fileExtensionCheck)	{
			fs.readFile(req.query.dir,'utf-8',function(err,file)	{
				if(err) res.end(JSON.stringify(err));
				//change \r\n to <br> (linebreaks) maybe later we can switch to http://hilite.me/
				//TODO : port http://hilite.me/api to node.js
				file = file.replace(/\n?\r\n/g, '<br />' );
				var uppath = req.originalUrl.replace(req.originalUrl.split("/")[req.originalUrl.split("/").length - 1],"");
				res.render('index', {pageTitle : config.pageTitle, 
					file : file, 
					path : req.originalUrl, 
					upPath : uppath
				});
			});
		}
		else {
			fs.readdir(req.query.dir,function(err,files){
				if(err)	res.end(err.toString());
				var uppath = req.originalUrl.replace(req.originalUrl.split("/")[req.originalUrl.split("/").length - 1],"");
				res.render('index', {pageTitle : config.pageTitle, 
					dataDir : files, 
					path : req.originalUrl,
					upPath : uppath
				});				
			});
		}
			
	}
	
});
