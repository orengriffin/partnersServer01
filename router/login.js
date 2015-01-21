/**
 * Created by admin on 1/21/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var async = require('async');

router.post('/', function (req, res) {
    var paramsReceived = req.body;
    db.settingsModel.findOne({param_name:paramsReceived.username})
        .exec(function (e, settings) {
            if (settings.param_value == paramsReceived.password)
                res.send('success');
            else
                res.send('bad credentials');
        });

} );


module.exports = router;