/**
 * Created by admin on 1/12/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var utils = require('./../utils');
var async = require('async');
var pub = require('./../pub');


function respond(res, error, message, isString, code) {
    var response = {
        error  : error,
        code   : (code) ? 1 : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
}
router.post('/updateLocation/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.update({_id: paramsReceived.session},
        {location: [paramsReceived.lat, paramsReceived.lon]},
        function (e, count, raw) {
            utils.tellPartnersNewDistance(paramsReceived.session, paramsReceived.lat, paramsReceived.lon);
            if (count && !e) {
                respond(res, e, 'success', true);
                console.log('location updated to ');
            }
            //res.send('{"message":"success"}');
        })
});

router.post('/updateToken/', function (req, res) {
    var paramsReceived = req.body;
    db.userModel.update({_id: paramsReceived.session},
        {udid: paramsReceived.token},
        function (e, count, raw) {
            if (count && !e) {
                respond(res, e, 'success', true);
                console.log('token updaed to ' + paramsReceived.token);
            }
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

    db.userModel.findByIdAndUpdate(paramsReceived.session,
        {$pull: {partners: {partner_num: paramsReceived.partner_id}}},
        function (e, count, raw) {
            respond(res, e, 'success', true);
        });
});
router.post('/setPartners/', function (req, res) {
    var paramsReceived = req.body;
    var time = new Date(Number(req.query.cb));

    async.parallel({
        activityId: function (callback) {
            db.activityModel.findOne({activity: paramsReceived.activity})
                .select('parent_activity_id')
                .exec(function (e, activity) {
                    callback(e, activity.parent_activity_id)
                });
        },
        me        : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('_id first_name partners relations')
                .exec(function (e, user) {
                    callback(e, user)
                })
        },
        partner   : function (callback) {
            db.userModel.findOne({user: paramsReceived.partner_id})
                .select('_id first_name relations')
                .exec(function (e, partner) {
                    callback(e, partner)
                })

        }
    }, function (err, results) {

        //
        //  Adding the new Partner
        //
        var NOneedToAddPartner = results.me.partners.some(function (partner) {
            if (partner.partner_id == results.partner.id) {
                partner.activity_relation = results.activityId;
                //partner.created = time;
                return true;
            }
            else return false;
        });

        if (!NOneedToAddPartner)
            results.me.partners.addToSet({
                partner_id       : results.partner.id,
                partner_num      : paramsReceived.partner_id,
                activity_relation: results.activityId,
                created          : time
            });

        async.parallel({
            saveMe: function (callback) {
                results.me.save(function (e) {
                    callback(null, !e);
                })
            },

            savePartner: function (callback) {
                results.partner.save(function (e) {
                    callback(null, !e);
                });

            }
        }, function (e, secondResults) {
            respond(res, e, "partner saved:" + secondResults.savePartner + " user saved: " + secondResults.saveMe, true);
        })
    });
});

router.get('/getPartnersList/', function (req, res) {
    console.log('getting partners');

    var paramsReceived = req.query;
    var partnersToReturn = [];

    var convertUser = function (partner, me, i) {   // backwards compatibilty


        var locationArray = partner.location;
        delete partner.location;

        if (me.partners[i].activity_relation)
            partner.relation = me.partners[i].activity_relation.activity;
        partner.two_way_trust = 1;
        partner.is_online = (partner.isOnline) ? 1 : 0;
        partner.location_longtitude = locationArray[0];
        partner.location_latitude = locationArray[1];
        partner.location = (me.location[0]) ? utils.distanceCalc(
            {lon: me.location[0], lat: me.location[1]},
            {longitude: locationArray[0], latitude: locationArray[1]}) : "";
        partner.last_seen = utils.timeCalc(partner.last_visit, 0);
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
        .populate('partners.activity_relation')
        .exec(function (e, user) {
            if (!user.partners[0])
                respond(res, e, partnersToReturn, true);
            user.partners.forEach(function (partner, index) {
                partnersToReturn.push(convertUser(partner.partner_id._doc, user._doc, index));
                if (partnersToReturn.length == this.length)
                    respond(res, e, partnersToReturn, true);
            }, user.partners);
        });
});
router.get('/newGetPartnersList/', function (req, res) {
    console.log('new getting partners');

    var paramsReceived = req.query;
    var partnersToReturn = [];

    var convertUser = function (partner, me, i) {   // backwards compatibilty

        var locationArray = partner.location;
        delete partner.location;

        if (me.partners[i].activity_relation)
            partner.relation = me.partners[i].activity_relation.activity;
        //partner.two_way_trust = 1;
        partner.is_online = (partner.isOnline) ? 1 : 0;
        partner.location = (me.location[0]) ? utils.distanceCalc(
            {lon: me.location[0], lat: me.location[1]},
            {longitude: locationArray[0], latitude: locationArray[1]}) : "";
        console.log(partner.location);

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
        .populate('partners.activity_relation')
        .exec(function (e, user) {
            if (!user.partners[0])
                respond(res, e, partnersToReturn, true);
            user.partners.forEach(function (partner, index) {
                partnersToReturn.push(convertUser(partner.partner_id._doc, user._doc, index));
                if (partnersToReturn.length == this.length)
                    respond(res, e, partnersToReturn, true);
            }, user.partners);
        });
});

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
        else {
            r.user.activities.addToSet(r.activityID);
            r.user.save(function (e) {
                res.send(JSON.stringify({
                    code   : 0,
                    error  : "",
                    message: {
                        pack: {
                            activity   : paramsReceived.activity,
                            activity_id: r.activityID
                        }
                    }
                }));

            })
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
                if (!e && c) {
                    console.log('updated');
                    respond(res, e, "success", true);
                }
                else
                    respond(res, e, "error", true);

            });
    else if (paramsReceived.type == 'viaEmail')
        db.userModel.update({_id: paramsReceived.session},
            {email_notification: !!Number(paramsReceived.status)},
            function (e, c, raw) {
                if (!e && c) {
                    console.log('updated');
                    respond(res, e, "success", true);
                }
                else
                    respond(res, e, "error", true);

            });
    else res.statusCode(404);
});

router.get('/stranger/', function (req, res) {
    var paramsReceived = req.query;
    async.parallel({
        userLoc : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('location partners _id blockedUsers')
                .exec(function (e, user) {
                    callback(e, user)
                });
        },
        stranger: function (callback) {
            db.userModel.findOne({user: paramsReceived.user})
                .select('_id first_name last_name image birthday last_visit location user relations isOnline')
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
                last_seen    : (r.stranger.isOnline) ? " " : utils.timeCalc(r.stranger.last_visit, 0),
                location     : utils.distanceCalc(
                    {lon: r.userLoc.location[0], lat: r.userLoc.location[1]},
                    {longitude: r.stranger.location[0], latitude: r.stranger.location[1]}),
                is_online    : (r.stranger.isOnline) ? 1 : 0,
                is_partners  : r.userLoc.partners.some(function (partner) {
                    return partner.partner_id.equals(r.stranger._id);
                }) ? 1 : 0,
                age          : String((!!r.stranger.birthday) ? utils.ageCalc(r.stranger.birthday) : ''),
                isBlocked    : (r.userLoc.blockedUsers.indexOf(r.stranger._id) != -1)

            }, true);

        };
        if (r.stranger) {
            if (!r.stranger.relations[0])
                strangerRespond('');
            r.stranger.relations.forEach(function (relation, index) {
                if (!!relation.partner_id.equals(r.userLoc._id))
                    strangerRespond(relation.relation);
                if (index == this.length && !responded)
                    strangerRespond('')
            }, r.stranger.relations);
        }
        else strangerRespond('');

    });
});
router.get('/newStranger/', function (req, res) {

    var paramsReceived = req.query;
    db.userModel.findById(paramsReceived.session)
        .select('location partners _id blockedUsers')
        .populate('partners.partner_id')
        .populate('partners.activity_relation')
        .exec(function (e, me) {
            me.partners.some(function (partner) {
                if (partner.partner_id.user == paramsReceived.user) {
                    var self = this;
                    var strangerRespond = function (relation) {
                        //responded = true;
                        respond(res, e, {
                            relation     : relation,
                            user         : partner.partner_id.user,
                            image        : partner.partner_id.image,
                            first_name   : partner.partner_id.first_name,
                            last_name    : partner.partner_id.last_name,
                            two_way_trust: 1,
                            last_seen    : (partner.partner_id.isOnline) ? " " : utils.timeCalc(partner.partner_id.last_visit, 0),
                            location     : (me.location[0]) ? utils.distanceCalc(
                                {lon: me.location[0], lat: me.location[1]},
                                {
                                    longitude: partner.partner_id.location[0],
                                    latitude : partner.partner_id.location[1]
                                }) : "",
                            is_online    : (partner.partner_id.isOnline) ? 1 : 0,
                            is_partners  : 1,
                            age          : String((!!partner.partner_id.birthday) ? utils.ageCalc(partner.partner_id.birthday) : ''),
                            isBlocked    : (me.blockedUsers.indexOf(partner.partner_id.id) != -1)

                        }, true);

                    };
                    strangerRespond(partner.activity_relation.activity);
                    return true;
                }
            }, me);
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
        if (paramsReceived.birthday) {
            paramsReceived.birthday = new Date(paramsReceived.birthday);
            paramsReceived.age = utils.ageCalc(paramsReceived.birthday);
        }
        paramsReceived.last_visit = new Date(Number(req.query.cb));
        //paramsReceived.isOnline = true;

        if (paramsReceived.longitude) {
            delete paramsReceived.longitude;
            delete paramsReceived.latitude;
        }
        else {
            console.log('no location recieved');
            delete paramsReceived.location;
        }

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
                    utils.myForEach(paramsReceived, function (prop, val, next) {
                        if (val && val != 'unknown' && String(user[prop]) != String(val)) {
                            console.log('Updating ' + prop + ' with ' + val);
                            user[prop] = val;
                        }
                        next();
                    }, function () {
                        //utils.tellPartnersOnlineStatus(user.id, 'online');
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
                                            console.log(newUser.first_name + ' ' + newUser.last_name + ' Added to DB');
                                            respond(newUser);
                                        });
                                });

                        });
                }

            });
    }
});
router.post('/newEnterApp/', function (req, res) {
    console.log('new enterApp');
    var paramsReceived = req.body;
    if (paramsReceived.fb_uid == 'null') {
        console.log('USER SEND A NULL FB ID');
        res.status(500).send({message: 'no facebook id'});
    } else {

        paramsReceived.location = [paramsReceived.longitude, paramsReceived.latitude];
        if (paramsReceived.birthday) {
            paramsReceived.birthday = new Date(paramsReceived.birthday);
            paramsReceived.age = utils.ageCalc(paramsReceived.birthday);
        }
        paramsReceived.last_visit = new Date(Number(req.query.cb));
        //paramsReceived.isOnline = true;

        if (paramsReceived.longitude) {
            delete paramsReceived.longitude;
            delete paramsReceived.latitude;
        }
        else {
            console.log('no locaction recieved');
            delete paramsReceived.location;
        }

        var respond = function (user) {
            var partnersArray = [];
            user.partners.forEach(function (partner, index) {
                partnersArray.push(partner.partner_num);
                if (index + 1 == user.partners.length)
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
                                session      : user._id + '',
                                partners     : partnersArray
                            }
                        });

            }, user);

        };
        db.userModel.findOne({fb_uid: paramsReceived.fb_uid})
            .exec(function (e, user) {
                if (user) { // update existing  user
                    async.parallel({
                        pubSub    : function (callback) {
                            if (user.newVersion || paramsReceived.newVersion)
                                pub.userOnline(user.id, function () {
                                    callback(null, true);
                                });
                        },
                        updateUser: function (callback) {
                            utils.myForEach(paramsReceived, function (prop, val, next) {
                                if (val && val != 'unknown' && String(user[prop]) != String(val)) {
                                    console.log('Updating ' + prop + ' with ' + val);
                                    user[prop] = val;
                                }
                                next();
                            }, function () {
                                callback(null, true);
                            });
                        }
                    }, function (e, res) {
                        user.save(function (e, savedUser) {
                            console.log(user.first_name + ' ' + user.last_name + ' Has logged in and updated');
                            respond(savedUser);
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
                                            console.log(newUser.first_name + ' ' + newUser.last_name + ' Added to DB');
                                            respond(newUser);
                                        });
                                });

                        });
                }

            });
    }
});

router.post('/blockUser', function (req, res) {

    var paramsReceived = req.body;

    async.parallel({
        me         : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .populate('partners.activity_relation')
                .exec(function (e, user) {
                    callback(e, user);
                });
        },
        userToBlock: function (callback) {
            db.userModel.findOne({user: paramsReceived.user_id})
                .exec(function (e, user) {
                    callback(e, user);
                });

        }
    }, function (e, r) {


        var indexOfBlocked = r.me.blockedUsers.indexOf(r.userToBlock._id);

        if (indexOfBlocked != -1) {
            async.parallel({
                removingBlockFromUser    : function (callback) {
                    db.userModel.update({_id: r.me._id},
                        {$pull: {blockedUsers: r.userToBlock._id}},
                        function (e, c, raw) {
                            callback(null, (!e && c));
                        });

                },
                removingBlockFromMessages: function (callback) {
                    db.messageModel.update({
                            $and: [
                                {recipient_id: r.me._id},
                                {sender_id: r.userToBlock._id}
                            ]
                        },
                        {isBlocked: false},
                        {multi: true},
                        function (e, c, raw) {
                            callback(e, !e);
                        });

                },
                firstMessage             : function (callback) {
                    db.messageModel.findOne({
                        $and: [
                            {recipient_id: r.me._id},
                            {sender_id: r.userToBlock._id},
                            {isRead: false}
                        ]
                    })
                        .sort('timeStamp')
                        .exec(function (e, message) {
                            callback(e, message);
                        });
                },
                relation                 : function (callback) {
                    var relationToReturn = null;
                    r.me.partners.some(function (partner) {
                        if (String(partner.partner_id) == String(r.userToBlock._id)) {
                            relationToReturn = partner.activity_relation.activity;
                            return true
                        }
                    });
                    callback(e, relationToReturn);
                }
            }, function (e, secondResults) {
                if (secondResults.removingBlockFromMessages && secondResults.removingBlockFromUser) {
                    if (secondResults.firstMessage)
                        utils.sendMessage({
                            session : secondResults.firstMessage.sender_id,
                            user_id : r.me.user,
                            message : secondResults.firstMessage.message,
                            relation: secondResults.relation
                        }, res, true);
                    else
                        respond(res, e, 'success', true);
                }

            });
        }
        else {
            r.me.blockedUsers.push(r.userToBlock._id);
            r.me.save(function (e) {
                if (!e)
                    respond(res, e, 'success', true);
                else
                    respond(res, e, 'error', true, 1);


            })
        }
    });
});
router.post('/specificPartners', function (req, res) {
    var paramsReceived = req.body;
    var partners = JSON.parse(paramsReceived.partners);

    db.userModel.findById(paramsReceived.session)
        .populate('partners.activity_relation')
        .exec(function (e, me) {
            var relationObj = {};
            me.partners.forEach(function (partner, index) {
                relationObj['user_' + String(partner.partner_num)] = partner.activity_relation.activity;
                console.log(relationObj);
                if (index + 1 == me.partners.length) {
                    db.userModel.find()
                        .or(partners)
                        .select('fb_uid user first_name last_name image')
                        .exec(function (e, partners) {
                            var partnersToReturn = [];
                            partners.forEach(function (partner, index) {
                                partnersToReturn.push(partner._doc);
                                partnersToReturn[index].relation = relationObj['user_' + partner.user];
                                if (partners.length == index + 1)
                                    respond(res, e, {partners: partnersToReturn}, true);

                            })
                        })

                }
            })
        })

});

router.post('/getNearPartners', function (req, res) {
    var paramsReceived = req.body;
    var membersToReturn = [];

    db.userModel.findById(paramsReceived.session)
        .select('location activities blockedUsers')
        .exec(function (e, me) {
            db.userModel.where('location')
                .where('_id').ne(paramsReceived.session)
                .and(utils.returnAgeGenderQuery(paramsReceived))
                .populate('activities')
                .where('location').near(me.location)
                .limit(10)
                .exec(function (e, users) {
                    users.forEach(function (user) {
                        membersToReturn.push(utils.returnSearchedMember(me, user));

                    });
                    console.log(membersToReturn);
                    res.send(membersToReturn);
                })
        })
});


module.exports = router;