/**
 * Created by admin on 10/22/2014.
 */
var express = require('express');
var router = express.Router();

router.get('/userlist', function(req, res) {
    var db = req.db;
    console.log("userlist was approached");
    db.collection('userlist').find().toArray(function (err, items) {
        res.json(items);
    });
});
router.get('/user', function(req, res) {
    var userN = { userName : req.query.username,
                    password :req.query.password};
    var state = req.query.signOrCreate;
    var sendBack = {link: '', message:''};
    var db = req.db.collection('userlist');
    var sent = false;

    db.find({userName:userN.userName}).toArray(function(err,result){
        if (result[0]) {
            if (state == 'Create')
                sendBack.message = 'Username Allready exist; try a Different username';
            else if (state == 'signin') {
                sendBack.link = 'app.html';
            }
        }
        else {
            if (state == 'Create') {
                db.insert(userN,  function(err, result){
//                  signIn();
                        console.log('created new user');
                    sendBack.link = 'app.html';
                    sent = true;
                    res.send(sendBack);
                });
            }
            else if (state == 'signin')
                sendBack.message = 'UserFacebookFriendsModel name doesnt exist ; try again or create user';
        }

                if (!sent) res.send(sendBack);
    });


//    res.send('server got = ' + req.query.username);

});
/*

var createUserF = function createUser(db, user)
{
}
*/

module.exports = router;