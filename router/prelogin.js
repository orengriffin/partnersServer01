/**
 * Created by admin on 1/22/2015.
 */
/**
 * Created by admin on 1/21/2015.
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
router.get('/', function (req, res) {
    db.userModel.where('user').lt(40)
        .sort('user')
        .select('image')
/*        .aggregate([
    {$match: {user:{$lt:20}}},
    //{$project:{images:1} },
            {
                $group:
                {
                    _id:null,
                    login_images:{$push:"$image"}}}
        ])*/
        .exec(function (e, images) {
            if (!e && !!images[0]) {
                //delete images[0]._id;
                images.unshift({image:'https://graph.facebook.com/idan.yalovich/picture'});
                respond(res, e, {login_images:images}, true);
            }
            else
                res.send('error' + e);
        });

} );


module.exports = router;