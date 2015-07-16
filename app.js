var express    = require('express');
var app        = express(); // Require and created new express object
var server     = require('http').Server(app); // Created new Server instance
var io         = require('socket.io')(server);
var bodyParser = require('body-parser'); // JSON PARSING
var redis      = require('./redis'); // REDIS DB CLIENT
var process    = require('child_process'); // MULTIPROCESS
var tools      = require('./tools'); // TOOLS
var db         = require('./db'); // MONGODB SCHEMAS

// Redis
var redis_client = redis.client;

// MongoDB
var Measurement = db.measurement;
var Board       = db.board;

// Authorization
var authorized = tools.authorized;

// Express config
app.use(bodyParser.json()); // PARSING JSON STRINGS TO JSON OBJECTS
server.listen(3000); // LISTEN AT PORT 3000

/*
	Data pattern
	{
		name: "board_name",
		password: "board_password",
		location: {
			lat: 232,
			lon: 32
		}
	}
*/
// CREATE NEW BOARD
app.post('/crud', function(req, res){
	var newboard = new Board({
		name: req.body.name,
        password: req.body.password,
        date: new Date
	});
	newboard.save(function(err){
		if(err){
			console.log(err);
		}
	});
});

// READ ALL
app.get('/crud', function(req, res){
	Board.find({}).select('-__v -password').populate('measurements').exec(function(e, data){
		if(err){
			console.log(err);
			res.json({error: err});
		}else{
			res.json(data);
		}
	});
});

//UPDATE BOARD
app.put('/crud', function(req, res){
	authorized(req, res, function(board){
		Board.update({_id: req.body._id}, {
			name: req.body.name,
			location: {
				lat: req.body.lat,
				lon: req.body.lon,
			},
			password: req.body.password,
		}, function(err){
			if(err){
				console.log(err);
				res.json({error: err});
			}else{
				res.sendStatus(200); // OK
			}
		});
	});
});

// DELETE BOARD
app.delete('/crud', function(req, res){
	authorized(req, res, function(board_named){
		Board.remove({_id: req.body._id}, function(err){
			if(err){
				console.log(err);
				res.json({error: err})
			}else{
				console.log('the ' + req.body.name + ' board has successfully been removed from the DataBase!')
				res.sendStatus(200); // OK
			}
		})
	});
});


/*
	Data pattern for saving a new measurement
	{
		location: {
			lat: 32,
			lon: 23
		},
        concentration: 23.232

	}
*/
// SAVING NEW MEASRUEMENT
app.post('/', function(req, res){
	authorized(req, res, function(board_name){
		var data = req.body;
		console.log('----------------------------------');
		console.log('Board ' + board_name);
		console.log('Board from: ' + req.connection.ip);
		console.log('Location:');
		console.log('\tLat: ', data.location.lat);
		console.log('\tLon: ', data.location.lon);
        console.log('Measurement: ', data.concentration);
		console.log('----------------------------------');

		// Save board_name:sensor_name = value LPUSH
		redis_client.lpush(board_name, sensors_names, function(err, reply){
			console.log(board_name + ' has ' + reply + ' sensors.');
		});


        redis_client.lpush(board_name, data.concentration, function(err, reply){
            if(err){
                console.log('Error: ', err);
            }
            else{
                console.log(board_name + 'has saved a new concentration value.');
            }
        } );


		// Emit live data to the client
		d = {
			name: board_name,
			_id: data._id,
			location: {
				lat: data.location.lat,
				lon: data.location.lon
			},
			measurement: [
                {
                    date: new Date,
                     concentration: data.concentration
                }
			]
		}

		io.emit('update', { data: d });
	});
});

// GET WEB PAGE
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var child = process.fork('./timesaving');
