/**
 * Created by admin on 1/19/2015.
 */
var express = require('express');
var router = express.Router();
var pub = require('./../pub');
var async = require('async');



router.post('/online/', function (req, res) {
    console.log('online router');
    var id = req.body.id;
    pub.userOnline(id, function (isConnected) {
        res.send('update  : '+ isConnected)
    });
});
module.exports = router;