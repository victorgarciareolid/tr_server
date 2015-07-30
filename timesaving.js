var db = require('./db');
var tools = require('./tools')
var redis = require('./redis');

var Measurement = db.measurement;
var Board = db.board;
var client = redis.client;

// Check every second
setInterval(function(){
    Board.find({}, function(e, boards){
		// For every board in the database
	for(var i = 0; i < boards.length; ++i){
    var board_name = boards[i].name;
    var board_data = boards[i];
    (function(board_name, board_data){
		client.ttl(board_name + "time", function(e, reply){
			// Check if there is a time control key for the board ckecked. If there isn't it creates a new one with
			// an expiration time of 30min;
	if(reply == -1)
    { // When the key exist but it hasn't set a time
		client.set(board_name + "time", board_name, function(e, reply){
		  console.log(reply);
        });
		client.expire(board_name + "time", 10);
	}
    else if(reply == -2)
    { // When it expires we reset the time control key and save the average of the data measured in the last 30 min
						/*
						    Check if the time control key has expirated. If it has expirated it gets the list of measurements taken
							in the last 30 min, make a arithmetic mean and save it to MongoDB.
							After that it creates a new time control key with an expiration time of 30 min.
						 */
        client.lrange(board_name, 0, -1, function(err, measurements){
            if(err)
            {
                console.log('Error: ', err)
            }
            else
            {
                var mean = tools.mean(measurements);
                client.del(board_name, function(e, r){
                    if(e) console.log('Error: ', e)
                });
                var measurement = new Measurement({
                    date: new Date,
                    concentration: mean
                });
                board_data.measurements.push(measurement);
                board_data.save(function(e){
                    if(e) console.log('Error: ', e);
                });
                measurement.save(function(e){
                    if(e) console.log('Error: ', e);
                });
            }
        });
						//Create new time control key with a 1800 seconds (30min) expiration time.
		client.set(board_name + "time", board_name);
		client.expire(board_name + "time", 10);
		}
		});
      })(board_name, board_data);
	}
	});
}, 1);

