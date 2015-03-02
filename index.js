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


// router

var chat = require('./router/chat');
var migrate = require('./router/migrate');
var user = require('./router/user');
var activity = require('./router/activity');
var settings = require('./router/settings');
var pubRouter = require('./router/pubRouter');
var login = require('./router/login');
var prelogin = require('./router/prelogin');


var uristring =
    process.env.MONGOLAB_URI;

app.use(bodyParser.urlencoded({extended: false}));


var pagesLoaded = 0;

fs.readFile (__dirname + '/credentials.json', function (err, data) {
    var credentials = JSON.parse(data.toString());
    if (!err)
    {
        uristring = credentials.mongo;
        pub.setKeys(credentials.pub.publish_key , credentials.pub.subscribe_key);
        sendMail.setKeys(credentials.sendgrid.password, credentials.sendgrid.username);
    }
    mongoose.connect(uristring, function (err, res) {
        if (err) {
            console.log('ERROR connecting to: ' + uristring + '. ' + err);
        } else {
            console.log('Succeeded connected to: ' + uristring);
        }
    });
    sendMail.init();
});

app.use('/admin', function (req, res, next) {
    var paramsReceived = req.query;
    if (paramsReceived.token) {
        if (paramsReceived.token == utils.token.get()) {
            utils.token.isLoading = true;
            return next();
        }
        else
            res.redirect('/');
    }

    if (utils.token.isLoading) {
        pagesLoaded++;
        console.log(pagesLoaded);
        utils.token.theToken = null;
        if (pagesLoaded == 35) {
            console.log('Admin Page Loaded');
            pagesLoaded = 0;
            utils.token.isLoading = false;
        }
        return next();
    }
    return res.end();
});

app.use('/admin', express.static(__dirname + '/admin'));

app.use(express.static('checkLogin'));


//app.listen(3456);
app.set('port', process.env.PORT || 3010);

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var id = (req.body.session) ? req.body.session : req.query.session;
    var cb = (req.body.cb) ? req.body.cb : req.query.cb;
    if (id && cb)
        db.updateLastSeen(id, cb);

    if (db.wasInit)
        next();
});



var mongodb = mongoose.connection;
mongodb.on('error', console.error.bind(console, 'connection error:'));
mongodb.once('open', function () {
    db.init(this.base);
});

//    routing

app.use('/migrate/', migrate);
app.use('/user/', user);
app.use('/settings/', settings);
app.use('/chat/', chat);
app.use('/activity/', activity);
app.use('/pub/', pubRouter);
app.use('/login/', login);
app.use('/getPreLoginSettings/', prelogin);

//

server = app.listen(app.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port)

});
