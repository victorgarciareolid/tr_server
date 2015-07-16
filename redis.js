var redis      = require('redis');

var client = redis.createClient();

client.on('connect', function(){
	console.log('Redis running! Connected to localhost:6379.')
});

module.exports.client = client;
