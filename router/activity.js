/**
 * Created by admin on 1/16/2015.
 */


var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var async = require('async');

function respond(res, error, message, isString) {

    var response = {
        error  : error,
        code   : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
}


//
//                Auto-Complete
//

router.get('/search/', function (req, res) {
    console.log ('auto-complete');

    var paramsReceived = req.query;
    var activitiesToReturn = [];
    db.activityModel.where('activity')
        .regex(new RegExp('^' + paramsReceived.activity, 'i'))
        .where('parent_activity').equals(0)
        .select('activity activity_id created parent_activity')
        .limit(3)
        .exec(function (e, activities) {
            activities.forEach(function (activity, index) {
                activitiesToReturn.push(activity._doc);
                delete activitiesToReturn[index]._id;
                console.log(activity.activity + ' ' + activity.parent_activity + ' ' + activity.activity_id);
                if (activitiesToReturn.length == this.length)
                    respond(res, '', activitiesToReturn, true);

            }, activities);
        });

});


router.get('/getPartners/', function (req, res) {
    console.log ('search was called');

    var paramsReceived = req.query;

    async.parallel({
        maxActivityId: function (callback) {
            db.activityModel.findOne({})
                .select('activity_id')
                .sort('-activity_id')
                .exec(function (e, activity) {
                    callback(e, activity.activity_id + 1);
                });
        },

        me      : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('location partners')
                .exec(function (e, me) {
                    callback(e, me)
                });
        },
        activity: function (callback) {
            db.activityModel.where('activity')
                .regex(new RegExp('^' + paramsReceived.activity + '$', 'i'))
                .select('parent_activity_id')
                .populate('parent_activity_id', '_id created activity activity_id')
                .exec(function (e, activity) {
                    callback(e, activity[0])
                });
        }
    }, function (e, r) {
        if (r.activity) {
            var membersToReturn = [];

            var genderQuery = [
                {gender: 'female'},
                {gender: 'unknown'},
                {gender: 'male'}
            ];
            if ((typeof paramsReceived['search_female']) != 'undefined' && !Number(paramsReceived['search_female']))
                genderQuery.shift();

            if ((typeof paramsReceived['search_male']) != 'undefined' && !Number(paramsReceived['search_male']))
                genderQuery.pop();

            var ageQuery = [
                {age: {$gt: (!!Number(paramsReceived['min_age'])) ? Number(paramsReceived['min_age']) : 17}},
                {age: {$lt: (!!Number(paramsReceived['max_age'])) ? Number(paramsReceived['max_age']) : 89}}
            ];
            if (ageQuery[0].age['$gt'] == 17 && ageQuery[1].age['$lt'] == 89)
                genderQuery.push({age: null});

            console.log(genderQuery);
            console.log(ageQuery);
            db.userModel.where('activities').elemMatch({$in: [r.activity.parent_activity_id._id]})
                .where('_id').ne(paramsReceived.session)
                .and([
                    {$or: genderQuery},
                    {$and: ageQuery}
                ])
                .where('location').near({center: r.me.location})
                .limit(40)
                .exec(function (e, users) {
                    if (!!users[0])
                        users.forEach(function (user) {
                            var idToDell = null;
                            var isMembers = this.me.partners.some(function (partner) {
                                if (!!partner.partner_id.equals(user._id)) {
                                    idToDell = partner._id;
                                    return true;
                                }
                                else return false
                            });
                            if (idToDell)
                                this.me.partners.id(idToDell).remove();
                            membersToReturn.push({
                                user       : user.user,
                                image      : user.image,
                                first_name : user.first_name,
                                last_name  : user.last_name,
                                last_seen  : db.timeCalc(user.last_visit, 0),
                                location   : db.distanceCalc(
                                    {lon: this.me.location[0], lat: this.me.location[1]},
                                    {longitude: user.location[0], latitude: user.location[1]}),// / 1000,
                                is_online  : (user.isOnline) ? 1 : 0,
                                is_partners: isMembers ? 1 : 0,
                                age        : (!!user.birthday) ? db.ageCalc(user.birthday) : ''

                            });

                            var str = user.last_name + ' ' + user.first_name + ' ' +
                                user.location[0] + ', ' + user.location[1] + ' age: ' + user.age + ' gender: ' + user.gender;
                            console.log(str);

                            if (membersToReturn.length == this.len) {
                                console.log('finish');
                                respond(res, e, {
                                    status: 0,
                                    data   : this.activity,
                                    members: membersToReturn
                                }, true);
                            }

                        }, {
                            len     : users.length,
                            activity: r.activity.parent_activity_id,
                            me      : r.me
                        });
                    else
                        respond(res,e,{
                            status:0,
                            members:[],
                            data: this.activity
                        },true);
                })
        }
        else {
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
                                status:2,
                                data  : {
                                    activity   : paramsReceived.activity,
                                    activity_id: activity._id
                                },
                                member: []
                            }
                        }));
                    })
            });

        }
    });
    /*
     db.userModel.aggregate([
     { $match : { "birthday" : { $exists : true} } },
     { $match: { "activities" : {$in: [r.activity.parent_activity_id._id]} } },
     //{ $project : {"ageInMillis" : {$multiply : ["$birthday"] } } },
     { $project : {"ageInMillis" : {$subtract : [new Date(), "$birthday"] } , "first_name": 1, "last_name": 1} },
     { $project : {"age" : {$divide : ["$ageInMillis", 31558464000] }}},
     // take the floor of the previous number:
     { $project : {"age" : {$subtract : ["$age", {$mod : ["$age",1]}]} }}
     //{ $project : {"first_name": 1, "last_name": 1}}
     //{ $group : { _id : "$age", Total : { $sum : 1} } }
     ])
     */
    //console.log('search Yoga for oren');
    /*
     db.userModel.findById(paramsReceived.session)
     .select('location')
     .exec(function (e, me) {
     //console.log('orens locations is ' + me.location[0] + ', ' + me.location[1]);
     db.activityModel.findOne({activity: paramsReceived.activity})
     .select('parent_activity_id')
     .populate('parent_activity_id')
     .exec(function (e, activity) {
     console.log('searching for ' + activity.parent_activity_id.activity);
     db.userModel.where('activities')
     .elemMatch({$in: [activity.parent_activity_id._id]})
     .where('user').ne(48)
     .where('location').near({center: me.location})
     .limit(40)
     .exec(function (e, users) {
     users.forEach(function (user) {
     var str = user.last_name + ' ' + user.first_name + ' ' +
     user.location[0] + ', ' + user.location[1];
     console.log(str);
     });
     })
     });
     });
     */


});


module.exports = router;