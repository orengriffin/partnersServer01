var express = require('express');
var router = express.Router();
var dbFunctions = require('./../mymongoose');


var pub = require("pubnub")({
    ssl          : true,
    publish_key  : 'pub-c-7d87a3c4-b1b8-4d33-be38-43b78065bc90',
    subscribe_key: 'sub-c-9d63a2c0-9665-11e4-9a03-02ee2ddab7fe'
});

router.post('/login', function (req, res)
{
    var channel = req.body.channel;
    res.send({channel: channel});
    subscribe(channel);
    sendMsg({msg: 'hello from Server !'}, channel);
});

function subscribe(channel)
{
    pub.subscribe({
        channel: channel,
        message: function (m)
        {
            console.log('server received message. channel : ' + channel);
            console.log(m);
        },
        connect: function ()
        {
            pub.publish({
                channel: channel,
                message: {"msg": 'Server Entered Chat !'}
            });
        },
        restore: true
    });
}

router.get('/getHistory', function (req, res)
{
    var user_id = req.query.session;

    dbFunctions.messageModel.find({
        $or: [
            {
                'sender': user_id
            },
            {
                'recipient': user_id
            }
        ]
    })
        .where('isRead').equals(true)
        .exec(function (e, messages)
        {
            res.send(JSON.stringify(messages));
        })

});

router.post('/appendCompleted', function (req, res)
{
    var messages = req.body.messages;
    console.log('messages');
    console.log(messages);
    for (var i = 0; i < messages.length; i++)
    {
        var msgId = messages[i]._id;
        dbFunctions.messageModel.findOne()
            .where('_id').equals(msgId)
            .exec(function (e, message)
            {
                message.set('isRead', true);
                message.save(function (err, message, numberAffected)
                {
                    console.log(message._id + ' was set to True.');
                });
            });
    }
    res.send('success');
});

router.get('/sendMessage', function (req, res)
{
    var message = req.query.message;
    var recipient = req.query.recipient;
    var sender = req.query.session;

    var newMessage = dbFunctions.messageModel({
        sender   : sender,
        recipient: recipient,
        message  : message,
        isRead   : false,
        timeStamp: Date.now()
    });

    newMessage.save();

});
module.exports = router;