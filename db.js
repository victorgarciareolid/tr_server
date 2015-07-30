var mongoose = require('mongoose')

var Schema = mongoose.Schema;

// Mongodb connection
// mongodb://<dbuser>:<dbpassword>@ds061701.mongolab.com:61701/data


url = 'mongodb://victor:45279BCO490@ds061701.mongolab.com:61701/data'

// Connection to MongoDb database
mongoose.connect(url, function(error){
	if(error) console.log(error);
	else console.log('MongoDB running! Connected to: ' + url);
});

// Schema definition
/*
	Date     = Date
	Mixed    = Mix of Json, strings, etc
	ObjectId = ref to an object
	Number   = float number
	String   = string
*/
var Measurement = new Schema({
	date: Date,
  concentration: Number
});

var Board = new Schema({
	name: String,
        password: String,
	location: {
		lat: Number,
		lng: Number
	},
        measurements: [{type: Schema.Types.ObjectId, ref: 'Measurement'}]
});

// Model definition
module.exports.board = mongoose.model('Board', Board);

module.exports.measurement = mongoose.model('Measurement', Measurement);
