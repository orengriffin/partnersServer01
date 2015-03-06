/**
 * Created by orengriffin on 3/2/15.
 */
var emailTemplates = require('swig-email-templates');

var sendMailFunctions = {
    sendGridKeys: {
        password: process.env.SENDGRID_PASSWORD,
        username: process.env.SENDGRID_USERNAME
    },

    db      : null,
    sendGrid: null,
    template :null,

    setTemplate: function (str) {
      this.template = str  ;
    },

    init: function () {
        var q = this;
        q.sendGrid = require("sendgrid")(q.sendGridKeys.username, q.sendGridKeys.password);
        q.db = require('./mymongoose');
        var self = this;
        emailTemplates(function (err, render) {
            var context = {
                name:'rotem'
            };
            render (__dirname + '/emailForUser.html', context, function (err, html, text) {

                var email = new self.sendGrid.Email({
                    to     : 'oren.griffin@gmail.com',
                    from   : 'partnersapp1@gmail.com',
                    subject: 'you have a message waiting from',
                    html: html
                    //text   : sender.first_name + " sent you " + message
                });
                self.sendGrid.send(email, function (err, json) {
                    console.log(err);
                });

            })

        })
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
        //var week = 604800000;
        var week = -1;
        //return;
        var lastMailDate = (recipient.lastMailDate) ? recipient.lastMailDate.getTime() : 0;
        if ((recipient.email_notification) &&
            (Date.now() - lastMailDate > week) &&
            (Date.now() - recipient.last_visit.getTime() > week) &&
            (this.validEmailAddress(recipient.email))) {

            var email = new this.sendGrid.Email({
                to     : recipient.email,
                from   : 'partnersapp1@gmail.com',
                subject: 'you have a message waiting from',
                //html: this.template
                text   : sender.first_name + " sent you " + message
            });
            email.addFilter('template', 'enable', 1);
            email.addFilter('template', 'text/html', this.template);
/*
            email.setFilters({
                'footer': {
                    'settings': {
                        'enable': 1,
                        'text/html': '<strong>You can haz footers!</strong>'
                    }
                }
            });

*/
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
