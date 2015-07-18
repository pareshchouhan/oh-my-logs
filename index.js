var express = require('express'),
	fs = require('fs'),
	app = express(),
	lessMiddleware = require('less-middleware'),
	_ = require('underscore')
	assert = require('assert'),
	path = require('path'),
	regexp = require('node-regexp');

var config = require('./config.js');

//Don't allow traversal of 2 up directories.
// var badWords = regexp().either('../../').toRegExp();
var checkDrives = /([A-Za-z]):.*/
// var fileMatch = regexp().either('.txt','.log','.logs','.md').toRegExp();

//app.use(express.bodyParser());
app.use(lessMiddleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, '/public/templates'));
//app.set('view engine', 'ejs');
app.set('view engine', 'jade');

var port = process.env.PORT || 1080;

app.listen(port,function(err)	{
	if(err)	console.log(err);
	console.log('Listening on ' + port);
});


app.get('/',function(req,res){
	console.log('Got a request for /');
	fs.readdir('./public',function(err,files){
		if(err)	res.end(err.toString());
		res.end(files);
	});
});

app.get('/test', function(req,res){
	res.render('index', {pageTitle : config.pageTitle});
});


app.get('/logs',function(req,res){

	if(req.query.dir != null)	{
		console.log(req.query.dir.match(checkDrives));
		
		for(word in config.badWords)	{
			var badWordRegex = regexp();
			badWordRegex.must(config.badWords[word]);
			badWordRegex = badWordRegex.toRegExp();	
			console.log("Bad Words Regex : " + req.query.dir.match(badWordRegex));
		}
		console.log("Drive Check Regex : " + req.query.dir.match(checkDrives));
		
	}	
	

	if(req.query.dir == null || req.query.dir == "" || req.query.dir.match(badWordRegex) || req.query.dir.match(checkDrives))	{
		fs.readdir('./',function(err,files){
			if(err)	res.end(err.toString());
			//res.redirect('/logs',302);
			console.log("Test");
			var uppath = req.originalUrl.replace(req.originalUrl.split("/")[req.originalUrl.split("/").length - 1],"");
			res.render('index', {pageTitle : config.pageTitle, 
				dataDir : files, 
				path : req.path + '?dir=.',
				upPath : uppath
			});
			//res.end(JSON.stringify(files));
		});	
	}
	else {
		var fileExtensionCheck = false;

		for(extension in config.fileMatch)	{
			if(req.query.dir.match(regexp().end(config.fileMatch[extension]).toRegExp()))	{
				fileExtensionCheck = true;
			}
		}

		if(fileExtensionCheck)	{
			fs.readFile(req.query.dir,'utf-8',function(err,file)	{
				if(err) res.end(JSON.stringify(err));
				file = file.replace(/\n?\r\n/g, '<br />' );
				var uppath = req.originalUrl.replace(req.originalUrl.split("/")[req.originalUrl.split("/").length - 1],"");
				res.render('index', {pageTitle : config.pageTitle, 
					file : file, 
					path : req.originalUrl, 
					upPath : uppath
				});
				//res.end(JSON.stringify(files));
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
				//res.end(JSON.stringify(files));
			});
		}
			
	}
	
});
