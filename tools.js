var md5	   = require('MD5');
var Board  = require('./db').board;
var redis  = require('./redis');
var client = redis.client;


/**
 * Rounds given number
 * @param {Number} num
 * @return {Number}
 *
 */
module.exports.round_1 = function(num)
{
    return Math.round(num * 10)/10;
}

/**
* [Gen nonce param]
* @param  {Number} length
* @return {String}
*/
var gen_nonce = function(length)
{
    var nonce = "";
    var mask = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // Gen random number between 0 and mask's length as times as length argument of gen_nonce function
    for( var i=0; i < length; i++ )
        nonce += mask.charAt(Math.floor(Math.random() * mask.length));

    return nonce;
}

// ARITHMETIC MEAN
module.exports.mean = function(array)
{
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
module.exports.authorized = function(request, response, callback)
{

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
    var auth_header = request.get("Authorization");
    if(auth_header !== undefined )
    {
        // Parsing response date_day
        try
        {
            auth_header            = auth_header.slice(7, auth_header.length).split(', ');
            client_header.username = auth_header[0].replace(/(username=)|(")/g, '');
            client_header.realm    = auth_header[1].replace(/(realm=)|(")/g, '');
            client_header.nonce    = auth_header[2].replace(/(nonce=)|(")/g, '');
            client_header.uri      = auth_header[3].replace(/(uri=)|(")/g,'');
            client_header.response = auth_header[4].replace(/(response=)|(")/g, '');

            var username = client_header.username;

            Board.findOne({name: username}, function(e, board){

            /*
				A1 = MD5(username:realm:password)
				A2 = MD5(method:uri)

				response = MD5(A1:nonce:A2)
			*/
                if(board == null|| e)
                {
                   console.log('Unauthorized');
                  response.sendStatus(401);
                }
                else
                {
                    A1 =  md5(username + ':' + client_header.realm + ':' + board.password);

			        A2 = md5(request.method + ':' + client_header.uri);

                    server_gen_response = md5(A1 + ':' + client_header.nonce + ':' + A2);
                    // Gen response to check if the client's request is the same as the generated string.
			        if(client_header.response == server_gen_response){
				        callback(client_header.username);
                        response.sendStatus(200);
			        }else{
				        console.log('Unauthorized.')
				        response.sendStatus(401) // 401 => status code for unauthorized
			        }

                 }
            });
        }
        catch(e)
        {
            console.log("Unauthorized");
            response.sendStatus(401)
        }
	// Request from a client (raspberry pi) trying to accces to a blocked source
    }else{
		server_reponse_pattern = 'Digest realm=' + server_header.realm + ', nonce=' + server_header.nonce;
		response.set('www-Authenticate', server_reponse_pattern);
		response.sendStatus(401);

	}
}
