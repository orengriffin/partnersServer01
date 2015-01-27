/**
 * Created by admin on 1/21/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var utils = require('./../utils');

var ranToken = require ('rand-token');

router.post('/', function (req, res) {
    var paramsReceived = req.body;

    if (!!paramsReceived.username)
        db.settingsModel.findOne({param_name:paramsReceived.username})
            .exec(function (e, settings) {
                if (settings.param_value == paramsReceived.password)
                {
                    var newToken = ranToken.generate(16);
                    utils.token.set(newToken);
                    res.send({
                        code:'success',
                        token: newToken
                    });
                }
                else
                    res.send('bad credentials');
            });
} );

router.post('/getUser/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.findOne({fb_uid:paramsReceived.fb_uid})
        .select('user')
        .exec(function (e, user) {
            if (!e && !!user)
                res.send(user.user + '');
            else
                res.send('bad credentials');
        });

} );


module.exports = router;