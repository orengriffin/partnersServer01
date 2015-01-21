/**
 * Created by admin on 1/16/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var async = require('async');


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


router.post('/removePartners/', function (req, res) {
    var paramsReceived = req.body;
    console.log('removePartners');
    db.userModel.findOne({user: paramsReceived.partner_id})
        .select('_id first_name')
        .exec(function (e, destUser) {
            console.log(destUser.first_name);
            db.userModel.update({_id: paramsReceived.session},
                {$pull: {partners: {partner_id: destUser._id}}},
                function (e, count, raw) {
                    if (!e && count)
                        res.send('success');
                });
        });
});


router.post('/setPartners/', function (req, res) {
    var paramsReceived = req.body;
    var time = new Date(Number(req.query.cb));

    async.parallel({
        activityId  : function (callback) {
            db.activityModel.findOne({activity: paramsReceived.activity})
                .select('parent_activity_id')
                .exec(function (e, activity) {
                    callback(e, activity.parent_activity_id)
                });
        },
        userSearched: function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('firt_name partners')
                .exec(function (e, user) {
                    callback(e, user)
                })
        },
        partnerId   : function (callback) {
            db.userModel.findOne({user: paramsReceived.partner_id})
                .select('_id first_name')
                .exec(function (e, partner) {
                    callback(e, partner._id)
                })

        }
    }, function (err, results) {
        results.userSearched.partners.addToSet({
            partner_id       : results.partnerId,
            activity_relation: results.activityId,
            created          : time
        });
        results.userSearched.save(function (e) {
            console.log(e);
        });
    });
});
router.post('/subscribeActivity/', function (req, res) {
    var paramsReceived = req.body;
    async.parallel({
        maxActivityId: function (callback) {
            db.activityModel.findOne({})
                .select('activity_id')
                .sort('-activity_id')
                .exec(function (e, activity) {
                    callback(e, activity.activity_id + 1);
                });
        },
        activityID   : function (callback) {
            db.activityModel.where('activity')
                .regex(new RegExp('^' + paramsReceived.activity + '$', 'i'))
                .exec(function (e, activities) {
                    var idToReturn = (!activities[0]) ? 0 : activities[0].parent_activity_id;
                    callback(e, idToReturn);
                });
        },
        user         : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('activities user')
                .exec(function (e, user) {
                    callback(e, user);
                });
        }
    }, function (e, r) {
        if (!r.activityID) {
            var newActivity = db.activityModel({
                activity_id       : r.maxActivityId,
                activity          : paramsReceived.activity,
                parent_activity   : 0,
                created           : new Date(),
                icon              : null,
                parent_activity_id: null
            });
            newActivity.save(function (e) {
                db.activityModel.findOne({activity_id: r.maxActivityId})
                    .exec(function (e, activity) {
                        var newUserActivity = db.userActivityModel({
                            user        : r.user.user,
                            user_id     : paramsReceived.session,
                            activity_id : r.maxActivityId,
                            activity_id_: activity._id

                        });
                        newUserActivity.save();
                        r.user.activities.addToSet(activity._id);
                        activity.parent_activity_id = activity._id;
                        activity.save();
                        r.user.save();
                        res.send(JSON.stringify({
                            code   : 0,
                            error  : "",
                            message: {
                                pack: {
                                    activity   : paramsReceived.activity,
                                    activity_id: activity._id
                                }
                            }
                        }));
                    })
            });
        }
        //console.log();
    });
});

router.post('/notification/', function (req, res) {
    var paramsReceived = req.body;
    if (paramsReceived.type == 'newPartner')
        db.userModel.update({_id: paramsReceived.session},
            {notify_partner: !!Number(paramsReceived.status)},
            function (e, c, raw) {
                console.log('updated');
            });
    if (paramsReceived.type == 'viaEmail')
        db.userModel.update({_id: paramsReceived.session},
            {email_notification: !!Number(paramsReceived.status)},
            function (e, c, raw) {
                console.log('updated');
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
