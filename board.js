#!/usr/bin/env nodejs

var Board = require("./db").board;
var program = require("commander");

var hash = function(string){
    return string
}

var authenticate = function(name, password, callback){
    Board.findOne({name:name}, function(e, board){
        if(e) console.log("Error: ", e);
        else{
            if(hash(password) == board.password){
                callback(board)
            }else{
                console.log("NOT ALLOWED");
            }
        }
    });
}

program
    .version("0.0.1");

// CREATE
program
    .command("create <name> <password> <lat> <lon>")
    .description("creates a new board")
    .action(function(name, password, lat, lon){
        var b = Board({
            name: name,
            password: password,
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

        authenticate(name, password, function(name, password){
            console.log(board)
            process.exit(0);
        });
    });

//UPDATE
program
.command("update <name> <password>")
    .description("update board")
    .action(function(name, password){
        authenticate(name, password, function(board){

        });
    });

// DELETE
program
    .command()
    .description()
    .action();
program.parse(process.argv);
