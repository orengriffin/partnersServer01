/**
 * Created by admin on 1/7/2015.
 */
var mySockets =
{
    users : {},

    init: function (io) {

        io.on('connection', function (socket) {
            console.log('a');
            socket.on('login', function (msg) {
                this.users[msg] = this.id;
            });

            socket.on('disconnect', function () {
                for (var prop in users) {
                    if (users[prop] == this.id) {
                        console.log('User ' + users[prop] + ' deleted.');
                        delete users[prop];
                    }
                }
            });

            socket.on('chat message', function (msg) {
                var message = JSON.parse(msg).message;
                var facebookId = JSON.parse(msg).sendTo;
                if (!users[facebookId]) {
                    console.log('cant send message, user hasnt logged in');
                }
                else {
                    if (((new Date()).getTime() - 1000 * 60 * 60 * 24) > users[facebookId].time)
                        console.log('time Stamp to old');
                    else {
                        console.log(' sending ' + message + ' to ' + users[facebookId].name);
                        var objToSend = {
                            msg       : message,
                            foreground: 1
                        };
                        //socket.broadcast.to(users[facebookId].socketId).emit('chat message', JSON.stringify(objToSend));
                    }
                }
            });
        })
    }
};

module.exports = mySockets;
