var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var dbFunctions = require('./mymongoose');

app.use(bodyParser.urlencoded({
    extended: true
}));

// router

var chat = require('./router/chat');
var migrate = require('./router/migrate');
var user = require('./router/user');

//

var uristring =
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://heroku_app31337616:obtp59dcp2qqaiushniu6ea4cu@ds049130.mongolab.com:49130/heroku_app31337616';

app.use(bodyParser.urlencoded({extended: false}));

app.set('port', process.env.PORT || 3010);

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    dbFunctions.init(this.base);
});


app.use('/migrate/', migrate);
app.use('/user/', user);
app.get('/', function (req, res) {
    res.send('Hello World!')
});

server = app.listen(app.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;
    //mySockets.init(io);
    console.log('Example app listening at http://%s:%s', host, port)

});
