/**
 * Created by admin on 10/22/2014.
 */
var express = require('express');
var router = express.Router();
var dbFunctions = require('./../mymongoose');

router.get('/userlist', function (req, res) {

});
router.get('/user', function (req, res) {
        var js = JSON.stringify(req.query);
        var id = JSON.stringify(req.query.id);
        dbFunctions.UserFacebookFriendsModel.find(id).exec(function (e, users) {
            if (!users[0]) {
                console.log('Creating new UserFacebookFriendsModel');
                var newUser = new dbFunctions.UserFacebookFriendsModel(req.query);
                newUser.save(function (err) {
                    if (!err)
                        res.send('success');
                    else
                        res.send('error');
                });
            }
            else {
                users[0].save(js);
                console.log('updated');
            }
        });
    }
);
router.get('/get', function (req, res) {
        var js = JSON.stringify(req.query);
        console.log(js);
        dbFunctions.oldUserModel.find({user: 1}).exec(function (e, users) {
            res.send(users[0]);
            console.log(users);
        });
    }
);

router.get('/users/1/', function (req, res) {
        console.log('users 1 was called');
        var index = 1;
        var max = 0;
        var err = 0;
        dbFunctions.oldUserModel.find({}, function (e, users) {
            max = users.length;
            for (var i = 0; i < users.length; i++) {
                var newUser = dbFunctions.userModel({
                    user              : users[i].user,
                    fb_uid            : users[i].fb_uid,
                    first_name        : users[i].first_name,
                    last_name         : users[i].last_name,
                    locale            : users[i].locale,
                    image             : users[i].image,
                    birthday          : new Date (Number(users[i].birthday) * 1000),
                    gender            : users[i].gender,
                    email             : users[i].email,
                    last_visit        : new Date(users[i].last_visit),
                    created           : new Date(users[i].created),
                    location          : [users[i].location_longtitude, users[i].location_latitude],
                    udid              : users[i].udid,
                    session           : users[i].session,
                    notify_partner    : users[i].notify_partner,
                    email_notification: users[i].email_notification,
                    platform          : users[i].platform,
                    last_update       : users[i].last_update,
                    activities        : [],
                    partners          : []
                });
                newUser.save(function (e) {
                    if (!!e)
                        err++;
                    console.log(index + ' ? ' + max);
                    if (index++ == max) {
                        res.send('success. ' + err + ' not passed');
                        console.log('success ' + err + ' not passed');
                    }
                });
            }
        });
    }
);
//            must be called after all 3 user activity mothods
//
//            adding each user its array of activities (_id)
//
router.get('/users/2/', function (req, res) {
    //dbFunctions.userActivityModel.find()
    console.log('user 2 was called.');
    dbFunctions.userModel.find({})
        .select('_id activities first_name user')
        .exec(function (e, users) {
            users.forEach(function (user) {
                dbFunctions.userActivityModel.find({user_id: user._id})
                    .select('activity_id_ activity_id')
                    .exec(function (e, activities) {
                        activities.forEach(function (activity) {
                            user.activities.addToSet(activity.activity_id_);
                            if (user.activities.length == this.length)
                                user.save(function (e) {
                                    console.log('errir is: ' + e + '. updating');
                                });
                        }, activities);

                    })
            });
        })
});


//              create  new activity collection based on old
//              Collection: activities  do first
//
router.get('/activities/1/', function (req, res) {
        console.log('activities 1 was called.');
        var index = 1;
        var max = 0;
        var err = 0;
        dbFunctions.oldActivityModel.find({}, function (e, activities) {
            max = activities.length;
            for (var i = 0; i < activities.length; i++) {
                var newActivity = dbFunctions.activityModel({
                    parent_activity_id: null,
                    parent_activity   : activities[i].parent_activity,
                    activity          : activities[i].activity,
                    activity_id       : activities[i].activity_id,
                    created           : new Date(activities[i].created),
                    icon              : activities[i].icon
                    //userActivity_id   : null
                });
                newActivity.save(function (e) {
                    if (!!e)
                        err++;
                    console.log(index + ' ? ' + max);
                    if (index++ == max) {
                        res.send('success. ' + err + ' not passed');
                        console.log('success ' + err + ' not passed');
                    }
                });
            }
        });
    }
);
// add the correct _id to the new actitives  parent_activity_id
//
//              Collection: activities  do second
//
router.get('/activities/2/', function (req, res) {
        console.log('activities 2 was called.');
        var index = 1;
        var max = 0;
        var err = 0;
        var ii = 0;
        dbFunctions.activityModel.find({}, function (e, activities) {
            max = activities.length;
            for (var i = 0; i < activities.length; i++) {
                var searchObj = {
                    parent_activity: activities[i].activity_id
                };
                var updateObj = {
                    parent_activity_id: activities[i]._id
                };
                dbFunctions.activityModel.update(searchObj, updateObj, {multi: true}, function (e, count, raw) {
                    ii++;
                    if (!!e)
                        err++;
                    index += (count) ? count : 1;
                    if (count == 0)
                        err++;
                    console.log(err + ' ' + ii + ' ' + index + ' ? ' + max);
                    /*
                     if ((index + err) == max) {
                     res.send('success. ' + err + ' not updated');
                     console.log('success ' + err + ' not updated');
                     }
                     */
                });

            }
        });
    }
);
// where ever it has parent_activity_id it gives it its own _id
//
//              Collection: activities  do third
//
router.get('/activities/3', function (req, res) {
        console.log('activities 3 was called.');
        var index = 1;
        var max = 0;
        var err = 0;
        dbFunctions.activityModel.find({parent_activity_id: null}, function (e, activities) {
            max = activities.length;
            for (var i = 0; i < activities.length; i++) {
                var searchObj = {
                    _id: activities[i]._id
                };
                var updateObj = {
                    parent_activity_id: activities[i]._id
                };
                dbFunctions.activityModel.findOneAndUpdate(searchObj, updateObj, {multi: true}, function (e, count, raw) {
                    if (!!e)
                        err++;
                    console.log(index + ' ? ' + max);
                    if (index++ == max) {
                        res.send('success. ' + err + ' not updated');
                        console.log('success ' + err + ' not updated');
                    }
                });

            }
        });
    }
);

//   adding _id to oldUserActivityModel of the user
//
//          creates: userActivities    | based on oldUserActivities and old users
//
router.get('/userActivities/1/', function (req, res) {
        console.log('userActivities 1 was called.');
        var index = 1;
        var max = 0;
        var err = 0;
        var arr = {};
        dbFunctions.userModel.find({}, function (e, users) {
            max = users.length;
            for (var i = 0; i < users.length; i++) {
                var searchObj = {
                    user: users[i].user
                };
                arr[users[i].user] = users[i]._id;
                dbFunctions.oldUserActivityModel.find(searchObj, function (e, oldUserActivities) {
                    for (var j = 0; j < oldUserActivities.length; j++) {
                        var newUserActivity = dbFunctions.userActivityModel({
                            user_id     : arr[oldUserActivities[j].user],
                            user        : oldUserActivities[j].user,
                            activity_id : oldUserActivities[j].activity_id,
                            activity_id_: null
                        });
                        newUserActivity.save(function (e) {
                            if (!!e)
                                err++;
                            console.log(index + ' ? ' + max);
                            if (index++ == max) {
                                res.send('success. ' + err + ' not passed');
                                console.log('success ' + err + ' not passed');
                            }
                        });
                    }

                });
            }
        });
    }
);

//
//
//          updates: userActivities    | based on activities
//
router.get('/userActivities/2/', function (req, res) {
        console.log('userActivities 2 was called.');

        var index = 0;
        var max = 0;
        dbFunctions.userActivityModel.count(function (e, count) {
            max = count;
        });
        dbFunctions.activityModel.find({}, function (e, activities) {
            for (var i = 0; i < activities.length; i++) {
                var searchObj = {
                    activity_id: activities[i].activity_id
                };
                var updateObj = {
                    activity_id_: activities[i]._id
                };
                dbFunctions.userActivityModel.update(searchObj, updateObj, {multi: true}, function (e, count, raw) {
                    index += (count) ? (count - 1) : 1;
                    //if (count == 0)

                    console.log(index + ' ? ' + max);
                    if (count > max)
                        res.send('success!');

                });
            }
        });
    }
);
//
//              Deletes all activity_id_ null
//
router.get('/userActivities/3/', function (req, res) {
    console.log('userActivities 3 was called.');
    dbFunctions.userActivityModel.remove({activity_id_: null}, function (err) {
        console.log(err);
        if (!err)
            res.send('succss');
    });

});

router.get('/partners/1/', function (req, res) {
    console.log('partners 1 was called');
    dbFunctions.oldPartnersModel.find({})
        .exec(function (e, partners) {
            partners.forEach(function (partner) {
                dbFunctions.userModel.findOne({user: partner.partner_id})
                    .select('_id')
                    .exec(function (e, user) {
                        if (!!user) {
                            var newPartner = dbFunctions.partnersModel({
                                partner_id : partner.partner_id,
                                created    : partner.created,
                                relation   : partner.relation,
                                partner_id_: user._id,
                                user       : partner.user,
                                relation_id: null
                            });
                            newPartner.save(function (e) {
                                console.log('saving');
                            });
                        }
                    })
            }, partners);

        });
});
//
//              adds each partner model  it's activity _id
//

router.get('/partners/2/', function (req, res) {
    console.log('partners 2 was called.');

    dbFunctions.partnersModel.remove({relation: ''})
        .exec(function (e, b) {
            dbFunctions.partnersModel.find({})
                .select('relation')
                .exec(function (e, partnersActivities) {
                    partnersActivities.forEach(function (partner) {
                        dbFunctions.activityModel.findOne({activity: partner.relation})
                            .select('parent_activity_id activity')
                            .exec(function (e, activity) {
                                partner.relation_id = activity.parent_activity_id;
                                partner.save(function () {
                                    console.log('updating');
                                });

                            });
                    });
                })
        });

});
//
//              adds each user its partners
//

router.get('/partners/3/', function (req, res) {
    console.log('partners 3 was called.');

    dbFunctions.userModel.find({})
        .select('_id first_name user partners')
        .exec(function (e, users) {
            users.forEach(function (user) {
                dbFunctions.partnersModel.find({user: user.user})
                    .exec(function (e, partners) {
                        partners.forEach(function (partner) {
                            user.partners.addToSet({
                                partner_id       : partner.partner_id_,
                                activity_relation: partner.relation_id,
                                created          : new Date(partner.created)
                            });
                            if (user.partners.length == this.length)
                                user.save(function (e) {
                                    console.log('error is: ' + e + '. updating');
                                });
                        }, partners);

                    })
            });
        })

});
//
//              search test
//
router.get('/search', function (req, res) {
    console.log('search Yoga for oren');
    dbFunctions.userModel.findOne({user: 48})
        .select('location')
        .exec(function (e, me) {
            console.log('orens locations is ' + me.location[0] + ', ' + me.location[1]);
            dbFunctions.activityModel.findOne({activity: 'run'})
                .select('parent_activity_id')
                .populate('parent_activity_id')
                .exec(function (e, activity) {
                    console.log('searching for ' + activity.parent_activity_id.activity);
                    dbFunctions.userModel.where('activities')
                        .elemMatch({$in: [activity.parent_activity_id._id]})
                        .where('user').ne(48)
                        .where('location').near({center: me.location})
                        .limit(10)
                        .exec(function (e, users) {
                            users.forEach(function (user) {
                                var str = user.last_name + ' ' + user.first_name + ' ' +
                                    user.location[0] + ', ' + user.location[1];
                                console.log(str);
                            });
                        })
                });
        });

});
//
//   add empty array to each user 
//

router.get('/autocomplete', function (req, res) {
    dbFunctions.activityModel.where('activity')
        .regex(new RegExp('^' + 'ru', 'i'))
        .where('parent_activity').equals(0)
        .limit(3)
        .exec(function (e, activities) {
            activities.forEach(function (activity) {
                console.log(activity.activity + ' ' + activity.parent_activity + ' ' + activity.activity_id);

            });
        });
});

router.get('/test', function (req, res) {


    /*
     //    change activiti model 'created' field to Date type.

     dbFunctions.oldActivityModel.find({})
     .exec(function (e, oldActivities) {
     oldActivities.forEach(function (oldActivity) {
     dbFunctions.activityModel.findOne({activity_id : oldActivity.activity_id})
     .exec( function (e, newActivity) {
     newActivity.created = new Date (oldActivity.created);
     newActivity.save( function (e) {
     console.log(e);
     });
     });
     }, oldActivities);
     });
     */
    /*
     dbFunctions.userModel.update({}, {partners: []}, {multi: true}, function (e, count, raw) {
     console.log('hope for good');
     })
     */

});
router.get('/del/', function (req, res) {
    dbFunctions.activityModel.remove({relation: {$exists: true}}).exec(function (e, partners) {
        console.log('hope for good');
    })

});
router.get('/birthday/', function (req, res) {
    dbFunctions.oldUserModel.find({})
        .select('birthday user')
        .exec(function (e,users){
            users.forEach(function (user) {
                dbFunctions.userModel.update({user:user.user},
                    {birthday:new Date(user.birthday * 1000)},
                    function(e,i,raw){
                        console.log('update');
                    })

            });
        });

});

//userActivities/3/ 40
router.get('/userActivities/3/', function (req, res) {
        var index = 0;
        var max = 0;
        dbFunctions.activityModel.find({}, function (e, docs) {
            for (var i = 0; i < docs.length; i++) {
                docs[i].special = undefined;
                docs[i].save();
            }
            console.log('test');
        });
    }
);

module.exports = router;