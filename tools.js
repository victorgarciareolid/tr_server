var md5	   = require('MD5');
var Board  = require('./db').board;
var redis  = require('./redis');
var client = redis.client;

/**
 * [Gen nonce param]
 * @param  {[Number]} length [length of the string generated]
 * @return {[String]}        [random alphanumeric string]
 */
var gen_nonce = function(length){
    var nonce = "";
    var mask = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // Gen random number between 0 and mask's length as times as length argument of gen_nonce function
    for( var i=0; i < length; i++ )
        nonce += mask.charAt(Math.floor(Math.random() * mask.length));

    return nonce;
}

// ARITHMETIC MEAN
module.exports.mean = function(array){
    var sum = 0;
    if(array == undefined || array.length == 0){
        return sum;
	}else{
		for(var i = 0; i < array.length; ++i){ // Addition of all the values
           sum += parseInt(array[i], 10);
		}
		return sum/array.length; // Divide by the number of elements in the array
	}
}

/**
 * [It checks if the user is authorized to access to private functions]
 * @param  {[Object]} request      [express req object from the http get/post functions]
 * @param  {[Object]} response     [express res object from the http get/post functions]
 * @param  {[function]} callback   [when the process finish allows the client to access to the private functions]
 * @return {[none]}                [none]
 */
module.exports.authorized = function(request, response, callback){

	// Header WWW-Authenticate
	var server_header = {
		nonce: gen_nonce(16),
		realm: 'raspberryberrypi',
	}

	// Header Authorization
	var client_header = {
		username: '',
		realm: '',
		response: '',
		nonce: '',
		uri: ''
	}

	// When client sends authorization requeriments
	if(request.get('Authorization') !== undefined){

		// Get the header authorization sent from the client
		var recv_header        = request.get('Authorization');

		// Parsing every single data
		recv_header            = recv_header.slice(7, recv_header.length).split(', ');
		client_header.username = recv_header[0].replace(/(username=)|(['"']+)/, '');
		client_header.realm    = recv_header[1].replace(/(realm=)|(['"']+)/, '');
		client_header.nonce    = recv_header[2].replace(/(nonce=)|(['"']+)/, '');
		client_header.uri      = recv_header[3].replace(/(uri=)|(['"']+)/, '');
		client_header.response = recv_header[4].replace(/(response=)|(['"']+)/, '');

		Board.find({name:client_header.username}, function(e, d){
			/*
				A1 = MD5(username:realm:password)
				A2 = MD5(method:uri)

				response = MD5(A1:nonce:A2)
			*/
			A1 =  md5(client_header.username + ':' + client_header.realm + ':' + d[0].password);

			A2 = md5(request.method + ':' + client_header.uri);

			server_gen_response = md5(A1 + ':' + client_header.nonce + ':' + A2);

			// Gen reponse to check if the client's request is the same as the generated string.
			if(client_header.response == server_gen_response){
				console.log('----------------------------------');
				console.log('Board authorized!');
				console.log('Board: ' + client_header.username + ' connected.');
				console.log('----------------------------------');
				callback(client_header.username);
			}else{
				console.log('Unauthorized.')
				response.sendStatus(401) // 401 => status code for unauthorized
			}
		});

	// Request from a client (raspberry pi) trying to accces to a blocked source
	}else{
		var recv_header = request.get('www-Authenticate');
		server_reponse_pattern = 'Digest realm=' + server_header.realm + ', nonce=' + server_header.nonce;
		response.set('www-Authenticate', server_reponse_pattern);
		response.sendStatus(401);

	}
}
