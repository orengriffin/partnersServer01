/**
 * Created by admin on 1/12/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');


router.post('/updateLocation/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.update({_id: paramsReceived.session}, {location: [paramsReceived.lat, paramsReceived.lon]}, function (e, count, raw) {
        if (count && !e)
            res.send('{"message":"success"}');
    })
});

router.post('/updateToken/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.update({_id: paramsReceived.session}, {udid: paramsReceived.token}, function (e, count, raw) {
        if (count && !e)
            res.send('{"message":"success"}');
    })
});


router.post('/updateLocation/', function (req, res) {
    console.log('update location was called.')
});


router.get('/isPartners/', function (req, res) {
    var paramsReceived = req.query;
/*
    var paramsReceived = {
        session : '54ad293c8f94e3d8344883ae',
        user: 17

    };

*/
    var partnersid = null;
    console.log('isPArters');
    db.userModel.findOne({user: paramsReceived.user})
        .select('_id first_name')
        .exec(function (e, destUser) {
            partnersid = destUser._id;
            console.log(destUser.first_name);
            db.userModel.findOne({_id:paramsReceived.session})
                .where('partners')
                .elemMatch(  {partner_id: partnersid}  )
                .exec(function (e, user) {
                    var message = (user) ? 1 : 0;
                    res.send('{"message":'+ message + ',"code":0,"error":"'+ e + '"}');
                });

        });
});
router.get('/max/', function (req, res) {
    db.userModel.findOne({})
        .select('user')
        .sort('-user')
        .exec(function (e, user) {
            console.log(user.user);
        });
});
router.post('/enterApp/', function (req, res) {

    var paramsReceived = req.body;
    if (!paramsReceived.fb_uid)
        res.send('no facebook id');
    paramsReceived.location = [paramsReceived.longitude, paramsReceived.latitude];
    paramsReceived.birthday = new Date(paramsReceived.birthday);
    paramsReceived.last_visit = new Date(Number(req.query.cb));

    delete paramsReceived.longitude;
    delete paramsReceived.latitude;

    var respond = function (user) {
        res.send(
            {
                code   : 0,
                message: {

                    login_success: true,
                    notifications: {
                        email      : (user.email_notification) ? '1' : '0',
                        new_partner: (user.notify_partner) ? '1' : '0'
                    },
                    uid          : user.user,
                    session      : user._id
                }
            });

    };
    db.userModel.findOne({fb_uid: paramsReceived.fb_uid})
        .exec(function (e, user) {
            if (user) { // update existing  user
                db.myForEach(paramsReceived, function (prop, val, next) {
                    if (val && val != 'unknown' && user[prop] != val)
                        user[prop] = val;
                    next();
                }, function () {
                    user.save(function (e) {
                        console.log(user.first_name + ' ' + user.last_name + ' Has logged in and updated');
                        respond(user);
                    });
                    console.log('finish');

                });
            }
            else {  // create new user
                db.userModel.findOne({})
                    .select('user')
                    .sort('-user')
                    .exec(function (e, lastUser) {
                        paramsReceived.user = lastUser.user + 1;
                        db.userModel(paramsReceived)
                            .save(function () {
                                db.userModel.findOne({user: paramsReceived.user})
                                    .select('_id first_name last_name email_notification notify_partner user')
                                    .exec(function (e, newUser) {
                                        console.log(newUser.first_name + ' ' + newUser.last_name + ' Has logged in and updated');
                                        respond(newUser);
                                    });
                            });

                    });
            }

        });

});


module.exports = router;