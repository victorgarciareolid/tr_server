var app        = require('express')();
var server     = require('http').Server(app);
var io         = require('socket.io')(server);
var bodyParser = require('body-parser'); // JSON PARSING
var redis      = require('./redis'); // REDIS DB CLIENT
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
server.listen(3000);

// Socket.io
io.on('connection', function(socket){
  console.log('broadcasting to website')
  Board.find({}).select('-__v -password -_id').populate('measurements', '-__v -_id').exec(function(err, data){
    if(err){
      console.log("Error: ", err);
    }else{
      socket.emit('historical_data', {data: data});
    }
  });
});


// SAVING NEW MEASRUEMENT
app.post('/data', function(req, res){
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
    data = {
        name: board_name,
        concentration: tools.round_1(data.concentration),
        date: new Date
    }
    io.sockets.emit('live_data', {data:data})
  });
});

// Check every second
setInterval(function(){
        Board.find({}, function(e, boards){
                // For every board in the database
        	for(var i = 0; i < boards.length; ++i){
        	var board_name = boards[i].name;
        	var board_data = boards[i];
       	 	(function(board_name, board_data){
            		redis_client.lrange(board_name, 0, -1, function(err, measurements){
                	if(err)
                	{
                    		console.log('Error: ', err)
                	}
                	else
                	{
                    		var mean = tools.mean(measurements);
                    		redis_client.del(board_name, function(e, r){
                        		if(e) console.log('Error: ', e)
                    		});
                    		var measurement = new Measurement({
                        		date: new Date,
                        		concentration: tools.round_1(mean)
                    		});
                    		board_data.measurements.push(measurement);
                    		board_data.save(function(e){
                        		if(e) console.log('Error: ', e);
                    		});
                    		measurement.save(function(e){
                        		if(e) console.log('Error: ', e);
        	            	});
	
                 	   	console.log("========================================");
                   		console.log("Board: " + board_name + " is saving data to mongoDB.")
                    		console.log("========================================");
                }
            });
         })(board_name, board_data);
        }
    });

}, 1800000);

// On SigInt signal
process.on('SIGINT', function(){
    console.log("Shuting down!")
    process.exit(0);
});
