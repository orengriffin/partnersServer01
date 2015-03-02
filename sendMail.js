/**
 * Created by orengriffin on 3/2/15.
 */
var sendMailFunctions = {
    sendGridKeys: {
        password: process.env.SENDGRID_PASSWORD,
        username: process.env.SENDGRID_USERNAME
    },

    db      : null,
    sendGrid: null,

    init: function () {
        var q = this;
        q.sendGrid = require("sendgrid")(q.sendGridKeys.username, q.sendGridKeys.password);
        q.db = require('./mymongoose');
    },

    setKeys: function (p, u) {
        this.sendGridKeys.password = p;
        this.sendGridKeys.username = u;
    },

    validEmailAddress: function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },


    send: function (sender, recipient, message) {
        var week = 604800000;
        //var week = -1;
        return;
        var lastMailDate = (recipient.lastMailDate) ? recipient.lastMailDate.getTime() : 0;
        if ((recipient.email_notification) &&
            (Date.now() - lastMailDate > week) &&
            (Date.now() - recipient.last_visit.getTime() > week) &&
            (this.validEmailAddress(recipient.email))) {

            var email = new this.sendGrid.Email({
                to     : recipient.email,
                from   : 'partnersapp1@gmail.com',
                subject: 'you have a message waiting from',
                text   : sender.first_name + " sent you " + message
            });

            this.sendGrid.send(email, function (err, json) {
                console.log(err);
            });
            this.db.userModel.findByIdAndUpdate(recipient._id,
                {lastMailDate: Date.now()},
                function (e, user) {
                    console.log('lastMaildate');
                })

        }

        console.log(recipient.last_visit.getTime());
    }


};
module.exports = sendMailFunctions;
