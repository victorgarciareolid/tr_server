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

                    console.log("=====================");
                    console.log("Board: " + board_name + "is saving data to mongoDB.")
                    console.log("=====================");
                }
            });
		    				//Create new time control key with a 1800 seconds (30min) expiration time.
	    })(board_name, board_data);
	}
    });
},1800 * 1000);

