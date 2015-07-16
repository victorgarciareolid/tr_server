var db = require('./db');
var tools = require('./tools')
var redis = require('./redis');

var Measurement = db.measurement;
var Board = db.board;
var client = redis.client;

// Check every second
setInterval(function(){
	Board.find({}, function(e, board){
		// For every board in the database
		for(var i = 0; i < board.length; ++i){
			var board_name = board[i].name;
			var board_id = board[i]._id;
			var board_actual_data = board[i];
			(function(board_name, board_id){
				client.ttl(board_name, function(e, reply){
					// Check if there is a time control key for the board ckecked. If there isn't it creates a new one with
					// an expiration time of 30min;
					if(reply == -1){ // When the key exist but it hasn't set a time
						client.set(board_name, board_name, function(e, reply){
							console.log(reply);
						});
						client.expire(board_name, 10);
					}else if(reply == -2){ // When it expires we reset the time control key and save the average of the data measured in the last 30 min
						/*
						    Check if the time control key has expirated. If it has expirated it gets the list of measurements taken
							in the last 30 min, make a arithmetic mean and save it to MongoDB.
							After that it creates a new time control key with an expiration time of 30 min.
						 */
						var mean = 0;
						// GET SENSORS NAME TYPE: ARRAY
                        client.lrange(board_name, 0, -1, function(err, measurements){
                            mean = tools.mean(measurements);
						});

						// SAVE MEASRUEMENT
						var measurement = new Measurement({
							date: new Date,
                            concentration: mean
						});

                        console.log(measurement, board_name, mean)

                        board_actual_data.measurements.push(measurement);
                        board_actual_data.save(function(err){
                            if(err) console.log(err);
                        });

						measurement.save(function(err, reply){
							if(err) console.log(err);
						});

						console.log('New measurement saved!')
						//Create new time control key with a 1800 seconds (30min) expiration time.
						client.set(board_name, board_name);
						client.expire(board_name, 10);
					}

					});
			})(board_name, board_id);
		}
	});
}, 1);

