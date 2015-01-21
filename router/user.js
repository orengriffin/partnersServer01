/**
 * Created by admin on 1/12/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var async = require('async');
var pub = require('./../pub');

router.get('/*', function (req, res, next) {
    var paramsReceived = req.query;
    if (typeof paramsReceived.cb != 'undefined')
        db.updateLastSeend(paramsReceived.session, paramsReceived.cb);
    next();
});
router.post('/', function (req, res, next) {
    var paramsReceived = req.body;
    if (typeof paramsReceived.cb != 'undefined')
        db.updateLastSeend(paramsReceived.session, paramsReceived.cb);
    next();
});

function respond(res, error, message, isString) {
    var response = {
        error  : error,
        code   : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
}
router.post('/updateLocation/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.update({_id: paramsReceived.session}, {location: [paramsReceived.lat, paramsReceived.lon]}, function (e, count, raw) {
        if (count && !e)
            respond(res, e, 'success', true);
        //res.send('{"message":"success"}');
    })
});

router.post('/updateToken/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.update({_id: paramsReceived.session}, {udid: paramsReceived.token}, function (e, count, raw) {
        if (count && !e)
            respond(res, e, 'success', true);
    })
});

//
//      Check if two users are partners and return 1 / 0
//

router.get('/isPartners/', function (req, res) {
    var paramsReceived = req.query;
    console.log('isPArters');
    db.userModel.findOne({user: paramsReceived.user})
        .select('_id first_name')
        .exec(function (e, destUser) {
            console.log(destUser.first_name);
            db.userModel.findOne({_id: paramsReceived.session})
                .where('partners')
                .elemMatch({partner_id: destUser._id})
                .exec(function (e, user) {
                    var message = (user) ? 1 : 0;
                    respond(res, e, message, true);
                });
        });
});

router.post('/removePartners/', function (req, res) {
    var paramsReceived = req.body;
    console.log('removePartners');
    //db.usermodel.findByIdAndUpdate(paramsReceived.session, {})
    db.userModel.findOne({user: paramsReceived.partner_id})
        .select('_id first_name')
        .exec(function (e, destUser) {
            console.log(destUser.first_name);
            db.userModel.update({_id: paramsReceived.session},
                {$pull: {partners: {partner_id: destUser._id}}},
                function (e, count, raw) {
                    if (!e && count)
                        respond(res, e, 'success', true);
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

router.get('/getPartnersList/', function (req, res) {
    console.log('getting partners');

    var paramsReceived = req.query;
    var partnersToReturn = [];

    var convertUser = function (partner, me) {   // backwards compatibilty
        var relationFound = '';

        partner.relations.forEach(function (relation, index) {
            if (String(relation.partner_id) == String(me._id))
                relationFound = relation.relation;
        });

        var locationArray = partner.location;
        delete partner.location;

        partner.relation = relationFound;
        partner.two_way_trust = 1;
        partner.is_online = (partner.isOnline) ? 1 : 0;
        partner.location_longtitude = locationArray[0];
        partner.location_latitude = locationArray[1];
        partner.location = db.distanceCalc(
            {lon: me.location[0], lat: me.location[1]},
            {longitude: locationArray[0], latitude: locationArray[1]});
        partner.last_seen = db.timeCalc(partner.last_visit, 0);
        partner.is_partners = 1;

        delete partner._id;
        delete partner.activities;
        delete partner.partners;
        delete partner.isOnline;
        delete partner.relations;
        delete partner.__v;

        return partner;
    };

    db.userModel.findById(paramsReceived.session)
        .select('partners location')
        .populate('partners.partner_id')
        .exec(function (e, user) {
            if (!user.partners[0])
                respond(res, e, partnersToReturn, true);
            user.partners.forEach(function (partner) {
                partnersToReturn.push(convertUser(partner.partner_id._doc, user._doc));
                if (partnersToReturn.length == this.length)
                    respond(res, e, partnersToReturn, true);
            }, user.partners);
        });
});
/*router.get('/max/', function (req, res) {
 db.userModel.findOne({})
 .select('user')
 .sort('-user')
 .exec(function (e, user) {
 console.log(user.user);
 });
 });*/

router.post('/subscribeActivity/', function (req, res) {
    console.log('subscribeActivity');

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
    });
});


router.delete('/removeActivity/', function (req, res) {

    var paramsReceived = req.body;
    var removeActivity = function (activity) {
        db.userModel.update({_id: paramsReceived.session},
            {$pull: {activities: activity}},
            function (e, c, raw) {
                if (!e && !!c)
                    respond(res, e, 'success', true);
                else
                    respond(res, e, 'error', true);
            });
    };
    if (isNaN(paramsReceived.activity_id))
        removeActivity(paramsReceived.activity_id);
    else
        db.activityModel.findOne({activity_id: paramsReceived.activity_id})
            .select('_id')
            .exec(function (e, activity) {
                if (!e && !!activity)
                    removeActivity(activity._id)
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

router.get('/stranger/', function (req, res) {
    var paramsReceived = req.query;
    async.parallel({
        userLoc : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('location partners _id')
                .exec(function (e, user) {
                    callback(e, user)
                });
        },
        stranger: function (callback) {
            db.userModel.findOne({user: paramsReceived.user})
                .select('_id first_name last_name image birthday last_visit location user relations')
                .exec(function (e, user) {
                    callback(e, user)
                });
        }
    }, function (e, r) {
        var responded = false;
        var strangerRespond = function (relation) {
            responded = true;
            respond(res, e, {
                relation     : relation,
                user         : r.stranger.user,
                image        : r.stranger.image,
                first_name   : r.stranger.first_name,
                last_name    : r.stranger.last_name,
                two_way_trust: 1,
                last_seen    : db.timeCalc(r.stranger.last_visit, 0),
                location     : db.distanceCalc(
                    {lon: r.userLoc.location[0], lat: r.userLoc.location[1]},
                    {longitude: r.stranger.location[0], latitude: r.stranger.location[1]}),
                is_online    : (r.stranger.isOnline) ? 1 : 0,
                is_partners  : r.userLoc.partners.some(function (partner) {
                    return partner.partner_id.equals(r.stranger._id);
                }) ? 1 : 0,
                age          : String((!!r.stranger.birthday) ? db.ageCalc(r.stranger.birthday) : '')

            }, true);

        };
        if (!r.stranger.relations[0])
            strangerRespond('');
        r.stranger.relations.forEach(function (relation, index) {
            if (!!relation.partner_id.equals(r.userLoc._id))
                strangerRespond(relation.relation);
            if (index == this.length && !responded)
                strangerRespond('')
        }, r.stranger.relations);

    });

});
router.get('/activities/', function (req, res) {
    var paramsReceived = req.query;
    var activitiesToReturn = [];
    db.userModel.findById(paramsReceived.session)
        .select('activities')
        .populate('activities')
        .exec(function (e, user) {
            if (!user.activities[0])
                respond(res, e, activitiesToReturn, true);
            user.activities.forEach(function (activitiyFromUser) {
                activitiesToReturn.push({
                    activity   : activitiyFromUser.activity,
                    activity_id: activitiyFromUser._id + ''
                });
                if (activitiesToReturn.length == this.length)
                    respond(res, e, activitiesToReturn, true);

            }, user.activities);
        });

});
router.post('/enterApp/', function (req, res) {
    console.log('enterApp');
    var paramsReceived = req.body;
    if (paramsReceived.fb_uid == 'null') {
        console.log('USER SEND A NULL FB ID');
        res.status(500).send({message: 'no facebook id'});
    } else {
        paramsReceived.location = [paramsReceived.longitude, paramsReceived.latitude];
        paramsReceived.birthday = new Date(paramsReceived.birthday);
        paramsReceived.last_visit = new Date(Number(req.query.cb));
        paramsReceived.age = db.ageCalc(paramsReceived.birthday);

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
                        session      : user._id + ''
                    }
                });

        };
        db.userModel.findOne({fb_uid: paramsReceived.fb_uid})
            .exec(function (e, user) {
                if (user) { // update existing  user
                    if (user.newVersion || paramsReceived.newVersion)
                        pub.subscribe(user._id);
                    db.myForEach(paramsReceived, function (prop, val, next) {
                        if (val && val != 'unknown' && String(user[prop]) != String(val)) {
                            console.log('Updating ' + prop + ' with ' + val);
                            user[prop] = val;
                        }
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
    }
});


module.exports = router;