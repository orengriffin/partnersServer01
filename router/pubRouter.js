/**
 * Created by admin on 1/19/2015.
 */
var express = require('express');
var router = express.Router();
var pub = require('./../pub');
var async = require('async');
var utils = require('./../utils');
var db = require('./../mymongoose');



router.post('/online/', function (req, res) {
    console.log('online router');
    var id = req.body.id;
    if (id) {
        pub.userOnline(id, function (channel) {
            db.userModel.findByIdAndUpdate(id,{channel:channel},
                function (c,m) {
                    console.log();
                });
            res.send(channel)
        });
    }
});

router.get('/whoIsOnline/', function (req, res) {
    console.log('who is online');
    db.userModel.find({isOnline: true})
        .where('newVersion').equals(true)
        .select('id first_name last_name fb_uid')
        .exec(function (e, users) {
           res.send(users);
        });
});
module.exports = router;