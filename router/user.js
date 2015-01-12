/**
 * Created by admin on 1/12/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');


router.post('/updateLocation/', function (req, res) {
    console.log('update location was called.')
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
    paramsReceived.location = [paramsReceived.longitude, paramsReceived.latitude  ];
    //paramsReceived.bri
    delete paramsReceived.longitude;
    delete paramsReceived.latitude;

    db.userModel.findOne({fb_uid: paramsReceived.fb_uid})
        //db.userModel.findOne({fb_uid: 4546978})
        //    .select('notify_partner email_notification _id user')
        .exec(function (e, user) {
            if (user) {
                user.last_visit = new Date();

                db.myForEach(paramsReceived, function (prop, val, next) {
                    //if (val && val != 'unknown' && user[prop] != val)
                    if (val && val != 'unknown')
                        user[prop] = val;
                    console.log(prop + ' : ' + val);
                    next();
                }, function () {
/*
                     user.save(function (e) {
                         console.log(e);
                     });
*/
                         console.log('finish');

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
                });
            }
            else {
                /*
                 db.userModel.findOne({})
                 .select('user')
                 .sort('-user')
                 .exec(function (e, lastUser) {
                 var newUser = db.userModel({
                 user              : lastUser.user + 1,
                 fb_uid            : Number(paramsReceived.fb_uid),
                 first_name        : paramsReceived.first_name,
                 last_name         : paramsReceived.last_name,
                 locale            : paramsReceived.locale,
                 image             : paramsReceived.image,
                 birthday          : paramsReceived.birthday,
                 gender            : paramsReceived.gender,
                 email             : paramsReceived.email,
                 last_visit        : paramsReceived.last_visit,
                 created           : new Date(),
                 location          : [Number(paramsReceived.location_longtitude),
                 Number(paramsReceived.location_latitude)],
                 udid              : paramsReceived.udid,
                 session           : paramsReceived.session,
                 notify_partner    : paramsReceived.notify_partner,
                 email_notification: paramsReceived.email_notification,
                 platform          : paramsReceived.platform,
                 last_update       : paramsReceived.last_update,
                 activities        : [],
                 partners          : []
                 });

                 });
                 */
            }

        });

});


module.exports = router;