#!/usr/bin/env nodejs

var Board = require("./db").board;
var program = require("commander");

var hash = function(string){
    return string
}

program
    .version("0.0.1");

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

program
.command("read <name> <password>")
    .description("read board information")
    .action(function(name, password){
        Board.findOne({name: name}, function(e, board){
            if(e) console.log("Error", e);
            else{
                if(hash(password) == board.password){
                    console.log(board)
                }else{
                    console.log("NOT ALLOWED")
                }
            }
            process.exit(0);
        });
    });


program.parse(process.argv);
