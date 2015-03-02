/**
 * Created by admin on 10/22/2014.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var utils = require('./../utils');
var async = require('async');



router.get('/get', function (req, res) {
        var js = JSON.stringify(req.query);
        console.log(js);
        db.oldUserModel.find({user: 1}).exec(function (e, users) {
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
        db.oldUserModel.find({}, function (e, users) {
            max = users.length;
            for (var i = 0; i < users.length; i++) {
                var newUser = db.userModel({
                    user              : users[i].user,
                    fb_uid            : users[i].fb_uid,
                    first_name        : users[i].first_name,
                    last_name         : users[i].last_name,
                    locale            : users[i].locale,
                    image             : users[i].image,
                    birthday          : (!!Number(users[i].birthday)) ? (new Date(Number(users[i].birthday) * 1000)) : null,
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
                    age               : (!!Number(users[i].birthday)) ? utils.ageCalc(new Date(Number(users[i].birthday) * 1000)) : null,
                    activities        : [],
                    blockUsers        : [],
                    partners          : [],
                    relation          : []
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
    //db.userActivityModel.find()
    console.log('user 2 was called.');
    db.userModel.find({})
        .select('_id activities first_name user')
        .exec(function (e, users) {
            users.forEach(function (user) {
                db.userActivityModel.find({user_id: user._id})
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
        db.oldActivityModel.find({}, function (e, activities) {
            max = activities.length;
            for (var i = 0; i < activities.length; i++) {
                var newActivity = db.activityModel({
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
        db.activityModel.find({}, function (e, activities) {
            max = activities.length;
            for (var i = 0; i < activities.length; i++) {
                var searchObj = {
                    parent_activity: activities[i].activity_id
                };
                var updateObj = {
                    parent_activity_id: activities[i]._id
                };
                db.activityModel.update(searchObj, updateObj, {multi: true}, function (e, count, raw) {
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
        db.activityModel.find({parent_activity_id: null}, function (e, activities) {
            max = activities.length;
            for (var i = 0; i < activities.length; i++) {
                var searchObj = {
                    _id: activities[i]._id
                };
                var updateObj = {
                    parent_activity_id: activities[i]._id
                };
                db.activityModel.findOneAndUpdate(searchObj, updateObj, {multi: true}, function (e, count, raw) {
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
        db.userModel.find({}, function (e, users) {
            max = users.length;
            for (var i = 0; i < users.length; i++) {
                var searchObj = {
                    user: users[i].user
                };
                arr[users[i].user] = users[i]._id;
                db.oldUserActivityModel.find(searchObj, function (e, oldUserActivities) {
                    for (var j = 0; j < oldUserActivities.length; j++) {
                        var newUserActivity = db.userActivityModel({
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
        db.userActivityModel.count(function (e, count) {
            max = count;
        });
        db.activityModel.find({}, function (e, activities) {
            for (var i = 0; i < activities.length; i++) {
                var searchObj = {
                    activity_id: activities[i].activity_id
                };
                var updateObj = {
                    activity_id_: activities[i]._id
                };
                db.userActivityModel.update(searchObj, updateObj, {multi: true}, function (e, count, raw) {
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
    db.userActivityModel.remove({activity_id_: null}, function (err) {
        console.log(err);
        //addCommonActivities('Comon')

        db.activityModel.update({}, {hasChildren: false}, {multi: true},
            function (e, c, raw) {
                console.log(c);
                db.activityModel.where('parent_activity').ne(0)
                    .exec(function (e, activities) {
                        activities.forEach(function (activity) {
                            db.activityModel.findByIdAndUpdate(activity.parent_activity_id,
                                {hasChildren: true},
                                function (e, model) {
                                    console.log(e);
                                })

                        })
                    })
            });
        if (!err)
            res.send('succss');
    });

});

function updateCommonActivities(oldCommonActivityStr, oldGeneralActivityStr, newCommonActivityStr, newGeneralActivityStr, mainCallback) {
    async.parallel({
        updateCommon : function (callback) {
            db.activityModel.findOneAndUpdate(
                {activity: oldCommonActivityStr},
                {activity: newCommonActivityStr},
                function (e, c) {
                    callback(null, (!e && c))
                })
        },
        updateGeneral: function (callback) {
            db.activityModel.findOneAndUpdate(
                {activity: oldGeneralActivityStr},
                {activity: newGeneralActivityStr},
                function (e, c) {
                    callback(null, (!e && c))
                })
        }

    }, function (e, results) {
        if (mainCallback)
            mainCallback(results.updateCommon && results.updateGeneral);
    })
}

function addCommonActivities(commonActivityStr, generalActivityStr, mainCallback) {
    db.activityModel.findOne({})
        .select('activity_id')
        .sort('-activity_id')
        .exec(function (e, max) {
            var max = max.activity_id + 1;

            var commonActivity = db.activityModel({
                activity_id       : max,
                activity          : commonActivityStr,
                parent_activity   : 0,
                created           : new Date(),
                icon              : null,
                parent_activity_id: null,
                hasChildren       : false
            });
            max++;
            var generalActivity = db.activityModel({
                activity_id       : max,
                activity          : generalActivityStr,
                parent_activity   : 0,
                created           : new Date(),
                icon              : null,
                parent_activity_id: null,
                hasChildren       : false
            });

            async.parallel({
                commonActivitySaved: function (callback) {
                    commonActivity.save(function (e, activity) {
                        activity.parent_activity_id = activity._id;
                        commonActivity.save(function (e) {
                            callback(null, !e);
                        })
                    });
                },
                generalAcvitySaved : function (callback) {
                    generalActivity.save(function (e, activity) {
                        activity.parent_activity_id = activity._id;
                        generalActivity.save(function (e) {
                            callback(null, !e);
                        })
                    });

                }
            }, function (e, results) {
                if (mainCallback)
                    mainCallback((results.commonActivitySaved && results.generalAcvitySaved) ? 'Success' : 'failure')
            });

        });

}

router.get('/partners/1/', function (req, res) {
    console.log('partners 1 was called');
    db.oldPartnersModel.find({})
        .exec(function (e, partners) {
            partners.forEach(function (partner) {
                db.userModel.findOne({user: partner.partner_id})
                    .select('_id')
                    .exec(function (e, user) {
                        if (!!user) {
                            var newPartner = db.partnersModel({
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

    db.partnersModel.remove({relation: ''})
        .exec(function (e, b) {
            db.partnersModel.find({})
                .select('relation')
                .exec(function (e, partnersActivities) {
                    partnersActivities.forEach(function (partner) {
                        db.activityModel.findOne({activity: partner.relation})
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

    db.userModel.find({})
        .select('_id first_name user partners')
        .exec(function (e, users) {
            users.forEach(function (user) {
                db.partnersModel.find({user: user.user})
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

router.get('/partners/4/', function (req, res) {
    console.log('partners 4 was called.');

    db.userModel.find({})
        .select('_id first_name user partners')
        .where('partners').ne([])
        .populate('partners.partner_id')
        .exec(function (e, users) {
            users.forEach(function (user) {
                user.partners.forEach(function (partner, index) {
                    if (partner.partner_id) {

                        partner.partner_num = partner.partner_id.user;
                        if (this.partners.length == index + 1)
                            this.save(function (e) {
                                console.log(e);
                            });
                    }
                    else
                        console.log('wtf');
                }, user)
            })
        })

});
//
//              search test
//
router.get('/search', function (req, res) {
    console.log('search Yoga for oren');
    db.userModel.findOne({user: 48})
        .select('location')
        .exec(function (e, me) {
            console.log('orens locations is ' + me.location[0] + ', ' + me.location[1]);
            db.activityModel.findOne({activity: 'run'})
                .select('parent_activity_id')
                .populate('parent_activity_id')
                .exec(function (e, activity) {
                    console.log('searching for ' + activity.parent_activity_id.activity);
                    db.userModel.where('activities')
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
    db.activityModel.where('activity')
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

     db.oldActivityModel.find({})
     .exec(function (e, oldActivities) {
     oldActivities.forEach(function (oldActivity) {
     db.activityModel.findOne({activity_id : oldActivity.activity_id})
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
     db.userModel.update({}, {partners: []}, {multi: true}, function (e, count, raw) {
     console.log('hope for good');
     })
     */

});
router.get('/del/', function (req, res) {
    /*
     var  settings = db.settingsModel ({
     id: 10,
     param_name: 'naor',
     param_value: 'admin1234'
     });
     settings.save();
     */
    /*
     db.userModel.update ({}, {relations:[]} , {multi:true}, function (e,c,raw) {
     console.log(c)
     });
     */

    db.userModel.update({user: 48}, {partners: []}, function (e, c, raw) {
        console.log(c);
    });
    db.userModel.update({user: 48}, {relations: []}, function (e, c, raw) {
        console.log(c);
    });

    /*
     db.userModel.update({user: 59}, {partners: []}, function (e, c, raw) {
     console.log(c);
     });
     db.userModel.update({user: 59}, {relations: []}, function (e, c, raw) {
     console.log(c);
     });
     db.userModel.update({user: 17}, {partners: []}, function (e, c, raw) {
     console.log(c);
     });
     db.userModel.update({user: 17}, {relations: []}, function (e, c, raw) {
     console.log(c);
     });
     */

    /*
     db.userModel.find({user:48})
     .exec(function (e,user) {
     console.log(user[0].last_visit);
     });
     */

    /*
     .exec(function (e) {
     console.log('hope for good');
     });
     */

    /*
     db.activityModel.remove({relation: {$exists: true}}).exec(function (e, partners) {
     console.log('hope for good');
     })
     */

});
router.get('/birthday/', function (req, res) {
    db.oldUserModel.find({})
        .select('birthday user')
        .exec(function (e, users) {
            users.forEach(function (user) {
                db.userModel.update({user: user.user},
                    {birthday: new Date(user.birthday * 1000)},
                    function (e, i, raw) {
                        console.log('update');
                    })

            });
        });

});
router.get('/addComon/', function (req, res) {
    addCommonActivities('Comon', 'Genera', function (stringToRespond) {
        res.send(stringToRespond);
    })

});
router.get('/updateComon/', function (req, res) {
    var paramsReceived = req.query;

    updateCommonActivities(paramsReceived.oldCommon, paramsReceived.oldGeneral,
        paramsReceived.newCommon, paramsReceived.newGeneral,
        function (success) {
            res.send((success) ? 'Success' : 'failure')
        })


});

router.get('/age/', function (req, res) {

    db.activityModel.update({}, {hasChildren: false}, {multi: true},
        function (e, c, raw) {
            console.log(c);
            db.activityModel.where('parent_activity').ne(0)
                .exec(function (e, activities) {
                    activities.forEach(function (activity) {
                        db.activityModel.findByIdAndUpdate(activity.parent_activity_id,
                            {hasChildren: true},
                            function (e, model) {
                                console.log(e);
                            })

                    })
                })
        });


    /*
     db.messageModel.where('recipient_id').equals('54ad293c8f94e3d8344883b9')
     .where('isRead').equals(false)
     .where('isBlocked').equals(false)
     .count(function (err, count) {
     console.log (count);
     });
     */

    /*
     db.userModel.find({fb_uid:'10152456757213601'})
     .where('first_name').ne('Oren')
     .exec(function (e, users) {
     db.userModel.findByIdAndRemove(users[0].id, function (e,c) {

     console.log(e);
     })
     });
     */
    /*    db.oldUserModel.find()
     .select('fb_uid user')
     .exec(function (e, users) {
     users.forEach(function (user) {
     db.userModel.findOneAndUpdate(
     {user:user.user},
     {fb_uid:user.fb_uid},
     function (e,c,raw) {
     console.log(e);
     }

     )
     })
     });*/
    /*
     db.userModel.update({}, {blockedUsers: []}, {multi: true}, function (e, c, raw) {
     console.log(c);
     });
     */
    /*
     db.userModel.update({}, {newVersion: false}, {multi: true}, function (e, c, raw) {
     console.log(c);
     });
     */
    /*

     db.userModel.find({})
     .or([
     {gender:'female'},
     {gender:'unknown'}
     ])
     .exec(function (e, users) {
     console.log(users.length);
     });
     */
    /*
     db.userModel.find({})
     .and([
     {gender:{$ne:'female'}},
     {gender:{$ne:'male'}}
     ])
     .exec(function (e, users) {
     console.log(e);
     });
     */


    /*
     db.userModel.count(function (e,c) {
     console.log(c);
     });
     var count =0;
     db.userModel
     .where('birthday').ne(null)
     .exec(function (e,users) {
     users.forEach(function (user) {
     console.log( count++);
     user.age = db.ageCalc(user.birthday);
     user.save();
     });
     //console.log(c);
     });
     */

    /*
     db.userModel.update({"birthday":(new Date(0))},
     {birthday:null},
     {multi:true},
     function (e,count,raw) {
     console.log(count);
     });
     */

    /*
     db.userModel
     //.find({birthday: new ISODate("1983-08-07T21:00:00Z")})
     .find({"birthday":(new Date(0))})
     //.select('birthday user')
     //.where('birthday').equals(new Date(0))
     .exec(function (e, users) {
     console.log('');
     */
    /*
     users.forEach(function (user) {
     db.userModel.update({user: user.user},
     {birthday: new Date(user.birthday * 1000)},
     function (e, i, raw) {
     console.log('update');
     })

     });
     */
    /*

     });
     */

});

//userActivities/3/ 40
router.get('/userActivities/3/', function (req, res) {
        var index = 0;
        var max = 0;
        db.activityModel.find({}, function (e, docs) {
            for (var i = 0; i < docs.length; i++) {
                docs[i].special = undefined;
                docs[i].save();
            }
            console.log('test');
        });
    }
);


/*router.get('/userlist', function (req, res) {

 });
 router.get('/user', function (req, res) {
 var js = JSON.stringify(req.query);
 var id = JSON.stringify(req.query.id);
 db.UserFacebookFriendsModel.find(id).exec(function (e, users) {
 if (!users[0]) {
 console.log('Creating new UserFacebookFriendsModel');
 var newUser = new db.UserFacebookFriendsModel(req.query);
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
 );*/
module.exports = router;