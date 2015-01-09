/**
 * Created by admin on 10/22/2014.
 */

var app = require('express')();
var server = require('http').Server(app);
var mongoose = require('mongoose');
var routes = require('./migrate');

var connectionString = process.env.CUSTOMCONNSTR_MONGOLAB_URI;
mongoose.connect(connectionString);

app.set('port',process.env.PORT || 3000);

server.listen(app.get('port'), function () {
    console.log("Node app is running at localhost: " + app.get('port'));
});

app.use('/', routes);

app.get('/', function (request, response) {
    response.send('Hello World!')
});


app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
var users = {};
io.on('connection', function (socket) {
    console.log('a');
    socket.on('login', function (userLoggedIn) {
        //console.log(userLoggedIn);
        var usersSocket = this.id;
        setTimeout(function () {
            console('broadcasting to ' + usersSocket);
            socket.broadcast.to(usersSocket).emit('logged in', 'true');
        }, 1000);
        userLoggedIn = JSON.parse(userLoggedIn);
        if (!!userLoggedIn.facebookId) {
            users[userLoggedIn.facebookId] = {
                socketId: this.id,
                name    : userLoggedIn.name,
                time    : (new Date()).getTime()
            };
            console.log(userLoggedIn.name + ' Logged In.');
        }
    });

    socket.on('chat message', function (msg) {
        var message = JSON.parse(msg).message;
        var facebookId = JSON.parse(msg).sendTo;
        if (!users[facebookId]) {
            console.log('cant send message, user hasnt logged in');
        }
        else {
            if (((new Date()).getTime() - 1000 * 60 * 60 * 24) > users[facebookId].time)
                console.log('time Stamp to old');
            else {
                console.log(' sending ' + message + ' to ' + users[facebookId].name);
                var objToSend = {
                    msg       : message,
                    foreground: 1
                };
                socket.broadcast.to(users[facebookId].socketId).emit('chat message', JSON.stringify(objToSend));
            }
        }
    });
});


/*
 socket.on('login', function (userNumber) {
 users[userNumber] = this.id;
 console.log(userNumber + ' Logged In.')
 });
 socket.on('chat message', function(msg){
 var text = JSON.parse(msg).msg;
 var userNumber = JSON.parse(msg).user;
 console.log('sending ' + text + ' to ' + userNumber);
 socket.broadcast.to(users[userNumber]).emit('chat message', text);
 });
 });
 */


/*
 var express = require('express')
 app = express();
 var http = require('http').Server(app);
 var io = require('socket.io')(http);

 //var mongo = require('mongoskin');
 //var passport = require ('passport');
 //var db = mongo.db("mongodb://localhost:27017/myown", {native_parser:true});
 //var db = mongo.db("'mongodb://oren:oren@ds047030.mongolab.com:47030/passauth");


 app.use(express.static(__dirname + '/public'))

 //app.use(passport.initialize());
 //app.use(passport.session());
 app.all('*', function(req, res, next) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 next();
 });

 */
/*
 app.use(function(req,res,next){
 req.db = db;
 next();
 });
 *//*


 app.listen(app.get('port'), function() {
 console.log("Node app is running at localhost:" + app.get('port'))
 });

 io.on('connection', function(socket){
 console.log('a user connected');
 });
 */
