#!/usr/bin/env nodejs

var Board   = require("./db").board;
var crypto  = require("crypto");

var sha = crypto.createHash("sha512");

var program = require("commander");

var hash = function(string){
    return sha.update(string).digest("hex");
}

var authenticate = function(name, password, callback){
    Board.findOne({name:name}, function(e, board){
        if(e) console.log("Error: ", e);
        else{
            if(board !== undefined || hash(password) == board.password){
                callback(board)
            }else{
                console.log("NOT ALLOWED");
            }
        }
    });
}

// INIT
program
    .version("0.0.1")
    .option("-n, --name <name>", "update name")
    .option("-lt, --latitude <lat>", "update latitude")
    .option("-ln, --longitude <lon>", "update longitude")
    .option("-p, --password <password>", "update password");

// CREATE
program
    .command("create <name> <password> <lat> <lon>")
    .description("creates a new board")
    .action(function(name, password, lat, lon){
        var b = Board({
            name: name,
            password: hash(password),
            location: {
                lat: lat,
                lng: lon
            }
        });

        b.save(function(e, b){
            if(e) console.log("Error: ", e);
            else{
                console.log("DONE");
                process.exit(0);
            }
        });
    });

// READ
program
    .command("read <name> <password>")
    .description("read board information")
    .action(function(name, password){

        authenticate(name, password, function(board){
            console.log(board);
            process.exit(0);
        });
    });

//UPDATE
program
    .command("update <name> <password>")
    .description("update board")
    .action(function(name, password){
        authenticate(name, password, function(board){

            if(program.board     !== undefined) board.name         = program.board;
            if(program.password  !== undefined) board.password     = hash(program.password);
            if(program.latitude  !== undefined) board.location.lat = program.latitude;
            if(program.longitude !== undefined) board.location.lng = program.longitude;
            board.save(function(e, b){
                if(e) console.log("Error: ", e);
                else{
                    console.log("DONE");
                    process.exit(0);
                }
            });
        });
    });

// DELETE
program
    .command("delete <name> <password>")
    .description("delete board")
    .action(function(name, password){
        authenticate(name, password, function(board){
            board.remove(function(e, b){
                if(e) console.log("Error: ", e);
                else{
                    console.log("DONE");
                    process.exit(0);
                }
            });
        });
    });
program.parse(process.argv);
