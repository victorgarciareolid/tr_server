var app        = require('express')();
var server     = require('http').Server(app);
var io         = require('socket.io')(server);
var cors       = require('cors');
var bodyParser = require('body-parser'); // JSON PARSING
var redis      = require('./redis'); // REDIS DB CLIENT
var children   = require('child_process'); // MULTIPROCESS
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
app.listen(3000); // LISTEN AT PORT 3000
app.use(cors());
// Socket.io
io.on('connection', function(socket){
  console.log('broadcasting to website')
  Board.find({}).select('-__v -password -_id').populate('measurements').exec(function(err, data){
    if(err){
      console.log(err);
    }else{
      socket.emit('historical_data', {data: data})
    }
  });
});


// SAVING NEW MEASRUEMENT
app.post('/', function(req, res){
	authorized(req, res, function(board_name){
		var data = req.body;
		console.log('----------------------------------');
		console.log('Board ' + board_name);
    console.log('Measurement: ', data.concentration);
		console.log('----------------------------------');
    redis_client.rpush(board_name, data.concentration, function(err, reply){
      if(err){
        console.log('Error: ', err);
      }
      else{
        console.log(board_name + ' has saved a new concentration value to redis.');
      }
    });
    Board.findOne({name: board_name}, function(e, d){
      datapoint = {
        name: board_name,
        location: d.location,
        concentration: data.concentration,
        date: new Date
      }
      io.emit('live_data', {data:data})
    });
  });
});

// GET WEB PAGE
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var child = children.fork('./timesaving');

process.on('SIGINT', function(){
  child.kill('SIGINT');
  process.exit(0);
});

