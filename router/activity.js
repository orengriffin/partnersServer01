/**
 * Created by admin on 1/16/2015.
 */


var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var utils = require('./../utils');
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
    console.log('auto-complete');
    var returnLimit = 5;

    var paramsReceived = req.query;
    db.activityModel.aggregate([
        {$match: {activity: {$regex: new RegExp('^' + paramsReceived.activity, 'i')}}},
        {
            $group: {
                _id: {parent: "$parent_activity"},
                act: {$push: {activity: "$activity", activity_id: '$activity_id'}}
            }
        },
        {$project: {act: 1, parent_activity: 1}},
        {$sort:{"_id.parent":1}}
    ])
        .limit(15)
        .exec(function (e, activities) {
            var arrOfAcvitivities = [], mainIndex = 0;
            if (mainIndex != returnLimit)
                activities.some(function (activity, index) {
                    if (!index && !activity._id.parent)
                        activities[0].act.some(function (activity) {
                            arrOfAcvitivities.push(activity.activity_id);
                            if (arrOfAcvitivities.length == returnLimit)
                                return true;
                        });
                    else
                    if (arrOfAcvitivities.length < returnLimit) {
                        if (arrOfAcvitivities.indexOf(activity._id.parent) == -1)
                            arrOfAcvitivities.push(activity._id.parent);
                        if (arrOfAcvitivities.length == returnLimit)
                            return true;
                    }

                }, activities);
            if (arrOfAcvitivities[0])
            {
                var arrToQuery = [];
                arrOfAcvitivities.forEach(function (activity) {
                    arrToQuery.push({activity_id:activity})
                });

                db.activityModel.find({$or: arrToQuery})
                    .select('activity activity_id created parent_activity')
                    .exec(function (e, activities) {

                        console.log(e);
                        respond(res, '', activities, true);
                });
            }
            else respond(res, '', [], true)

        });

});


router.get('/getPartners/', function (req, res) {
    console.log('search was called');

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
                .select('location partners user activities blockedUsers newVersion')
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
            var searchIteration = paramsReceived.searchIteration;
            r.me.activities.addToSet(r.activity.parent_activity_id._id);
            r.me.save(function (e) {
                console.log('added activity after search' + e);
            });

            var membersToReturn = [];
            var andQuery =  utils.returnAgeGenderQuery(paramsReceived);

 /*           var genderQuery = [
                {gender: 'female'},
                //{gender: 'unknown'},
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

            var andQuery = [{$or: genderQuery},
                {$and: ageQuery}
            ];
            if (ageQuery[0].age['$gt'] == 17 && ageQuery[1].age['$lt'] == 89) {
                genderQuery.push({age: null});
                andQuery.pop();

            }

            console.log(genderQuery);
            console.log(ageQuery);
            console.log(andQuery);
*/
            db.userModel.where('activities').elemMatch({$in: [r.activity.parent_activity_id._id]})
                .where('_id').ne(paramsReceived.session)
                .and(andQuery)
                .where('location').near({
                    center: r.me.location,
                    maxDistance :parseFloat(100/6371),
                    spherical: true
                })
                .populate('activities')
                .skip((searchIteration-1) * 30)
                .limit(31)
                .exec(function (e, users) {
                    if (!!users[0])
                        users.forEach(function (user, index) {
/*
                            membersToReturn.push({
                                user       : user.user,
                                image      : user.image,
                                first_name : user.first_name,
                                last_name  : user.last_name,
                                last_seen  : (user.isOnline) ? " " : utils.timeCalc(user.last_visit, 0),
                                location   : utils.distanceCalc(
                                    {lon: this.me.location[0], lat: this.me.location[1]},
                                    {longitude: user.location[0], latitude: user.location[1]}),// / 1000,
                                is_online  : (user.isOnline) ? 1 : 0,
                                is_partners: isMembers ? 1 : 0,
                                age        : (!!user.birthday) ? utils.ageCalc(user.birthday) : '',
                                isBlocked  : this.me.blockedUsers.indexOf(user.id) != -1

                            });
*/
                                var str = user.last_name + ' ' + user.first_name + ' ' +
                                user.location[0] + ', ' + user.location[1] + ' age: ' + user.age + ' gender: ' + user.gender;
                            console.log(str);

                            if (membersToReturn.length == this.len - 1) {
                                paramsReceived.showMore = (this.len == 31);
                                console.log('finish');
                                var newMembersObj = (r.me.newVersion) ?  {searched:paramsReceived ,members:membersToReturn} : membersToReturn;
                                respond(res, e, {
                                    status : 0,
                                    data   : this.activity,
                                    members: newMembersObj
                                }, true);
                            }
                            else
                                membersToReturn.push(utils.returnSearchedMember(this.me,user ,this.activity.activity));
                        }, {
                            len     : users.length,
                            activity: r.activity.parent_activity_id,
                            me      : r.me
                        });
                    else
                    {
                        var newMembersObj = (r.me.newVersion) ?  {searched:paramsReceived ,members:membersToReturn} : membersToReturn;
                        respond(res, e, {
                            status : 0,
                            members: newMembersObj,
                            data   : this.activity
                        }, true);

                    }
                })
        }
        else {
            var newActivity = db.activityModel({
                activity_id       : r.maxActivityId,
                activity          : paramsReceived.activity,
                parent_activity   : 0,
                created           : new Date(),
                icon              : null,
                parent_activity_id: null,
                hasChildren : false
            });
            newActivity.save(function (e, activity) {
                        var newUserActivity = db.userActivityModel({
                            user        : r.me.user,
                            user_id     : paramsReceived.session,
                            activity_id : r.maxActivityId,
                            activity_id_: activity._id

                        });
                        newUserActivity.save();
                        r.me.activities.addToSet(activity._id);
                        activity.parent_activity_id = activity._id;
                        activity.save();
                        r.me.save();
                        var newMembersObj = (r.me.newVersion) ?  {searched:paramsReceived ,members:[]} : [];
                        res.send(JSON.stringify({
                            code   : 0,
                            error  : "",
                            message: {
                                status: 2,
                                data  : {
                                    activity   : paramsReceived.activity,
                                    activity_id: activity._id
                                },
                                member: newMembersObj
                            }
                        }));
            });

        }
    });

});

router.get('/searchActivities/', function (req, res) {
    var paramsReceived = req.query;
    var orQuery = [];

    if (paramsReceived.parentOnly != 'False')
        orQuery.push({parent_activity : 0});

    if (paramsReceived.hasChildren != 'False')
        orQuery.push({hasChildren : true});
    else
        orQuery.push({hasChildren : false});

    if (paramsReceived.searchStr)
        orQuery.push({$regex:new RegExp(paramsReceived.searchStr, 'i')});
    var skip = paramsReceived.searchNumber * 10;
    db.activityModel.find()
        .and(orQuery)
        .sort('-created')
        .skip(skip)
        .limit (skip + 10)
        .exec(function (e, activities) {
            res.json(activities);
        })
} );


module.exports = router;