// ========================================================================
// Server init
// ========================================================================

// Filesystem reading functions
const fs = require('fs-extra');

// Load settings
try {
  stats = fs.lstatSync('./json/settings.json');
} catch (e) {
  // If settings do not yet exist
  if (e.code == "ENOENT") {
    try {
      fs.copySync(
        './json/settings.example.json',
        './json/settings.json'
      );
      console.log("Created new settings file.");
    } catch (e) {
      console.log(e);
      throw "Could not create new settings file.";
    }
    // Else, there was a misc error (permissions?)
  } else {
    console.log(e);
    throw "Could not read 'settings.json'.";
  }
}

// Load settings into memory
const settings = require("./json/settings.json");

// Setup basic express server
var express = require('express');
var app = express();
var cors = require("cors")
var http = require("http");
if (settings.express.serveStatic)
  app.use(express.static('./build/www', {
    extensions: ['html']
  }));
var server = require('http').createServer(app, console.log());

server.listenerCount(1);

app.get('/sitemap.xml', function(req, res) {
  res.sendFile('./build/www/sitemap.xml');
});
app.use('/robots.txt', function(req, res, next) {
  res.type('text/plain')
  res.send("User-agent: *\nDisallow: /chat\nSitemap: https://bonziworld.co/sitemap.xml");
});
const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  points: 3, // 5 points
  duration: 3600 // per second
});


app.use((req, res, next) => {
	console.log("user connected: "+req.ip)
	if (!req.ip.match(/172./gi) && !req.ip.match(/162./gi)) {
		res.status(403).send('no.');
		return;
	}
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
		express.static(__dirname + '/public', {
		  extensions: ['html']
		})
    })
    .catch(() => {
      res.status(429).send('Too Many Requests');
	  return;
    });
	
});
// Init socket.io
var io = require('socket.io')(server, {
  allowEIO3: true
});
var port = process.env.PORT || settings.port;
exports.io = io;

// Init sanitize-html
var sanitize = require('sanitize-html');

// Init winston loggers (hi there)
const Log = require('./log.js');
Log.init();
const log = Log.log;

// Load ban list
const Ban = require('./ban.js');
Ban.init();

// Start actually listening
server.listen(port, function() {
  console.log(
    " Welcome to BonziWORLD!\n",
    "Time to meme!\n",
    "----------------------\n",
    "Server listening at port " + port
  );
});

/*
app.use(function(req, res) {
	if (!req.ip.match(/172./gi) || req.ip.match(/162./gi)) {
		res.status(403).send('no.');
		return;
	}
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send('Too Many Requests');
    });
  res.status(404).type('html').sendFile(__dirname + '/404.html')
})
*/
// ========================================================================
// Banning functions
// ========================================================================

// ========================================================================
// Helper functions
// ========================================================================

const Utils = require("./utils.js")

// ========================================================================
// The Beef(TM)
// ========================================================================

const Meat = require("./meat.js");
Meat.beat();
// Console commands
const Console = require('./console.js');
Console.listen();