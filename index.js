var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var db = require('./mymongoose');
var utils = require('./utils');
var fs = require ('fs');
var pub = require ('./pub');
var sendMail = require ('./sendMail');
var async = require ('async');
var r = require('./route');
var ejs = require('ejs');



// router

var uristring =
    process.env.MONGOLAB_URI;

app.use(bodyParser.urlencoded({extended: false}));


var fbid = '';

fs.readFile (__dirname + '/credentials.json', function (err, data) {
    var credentials = JSON.parse(data.toString());
    if (!err)
    {
        uristring = credentials.mongo;
        pub.setKeys(credentials.pub.publish_key , credentials.pub.subscribe_key);
        sendMail.setKeys(credentials.sendgrid.password, credentials.sendgrid.username);
    }

    fbid = credentials.fbid || process.env.FBID;

    mongoose.connect(uristring, function (err, res) {
        if (err) {
            console.log('ERROR connecting to: ' + uristring + '. ' + err);
        } else {
            sendMail.init();
            console.log('Succeeded connected to: ' + uristring);
        }
    });
});

app.use(express.static('public/'));
app.set('views', 'public');
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('index.ejs', {fbid:fbid});
});


app.set('port', process.env.PORT || 3010);

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    if (db.wasInit)
    {
        var id = (req.body.session) ? req.body.session : req.query.session;
        var cb = (req.body.cb) ? req.body.cb : req.query.cb;
        if (id && cb)
            db.updateLastSeen(id, cb);

        next();
    }
});



var mongodb = mongoose.connection;
mongodb.on('error', console.error.bind(console, 'connection error:'));
mongodb.once('open', function () {
    db.init(this.base);
});

r.route(app, ['migrate', 'user', 'settings', 'chat', 'activity', 'login',
    ['pub', 'pubRouter'], ['getPreLoginSettings', 'prelogin' ]]);
//

server = app.listen(app.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port)

});
