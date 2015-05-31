/* Facebook Controller */

var fbController = (function () {

    function sendMyFriends() {
        var successFunc = function (response) {
            var arrToSend = [];
            for (var i = 0; i < response.data.length; i++) {
                arrToSend.push(response.data[i].id)
            }
            $.ajax({
                url: BASE_SERVER + '/user/facebookFriends',
                type: 'POST',
                data: {
                    friends: arrToSend,
                    id: userModel.get('session')
                },
                success: function (res) {
                    console.log('facebook friends sent :' +  res);
                },
                error: function (res) {
                    console.log(res);
                }
            })
        };

        //if (device.platform == 'android' || device.platform == 'Android')
            window.facebookConnectPlugin.api('me/friends?limit=5000', [], successFunc, function (res) {
                console.log(res);
            });
/*
        else
            window.facebookConnectPlugin.api('me/friends?limit=5000', successFunc, function (res) {
                console.log(res);
            });
*/
    }

    function postToWall (e, searched) {
            if (e)
                e.preventDefault();
            facebookConnectPlugin.showDialog(
                {
                    method     : "feed",
                    //picture    : 'http://www.partners-app.co.il/wp-content/uploads/2015/03/partners-la.png',
                    picture    : 'http://applications.co.il/wp-content/uploads/2015/04/partners-la.png',
                    link       : 'http://www.partners-app.com',
                    name       : (searched.activity) ? "Join me for #" + searched.activity + '!' : "Join me in Partners App!",
                    //message    : 'First photo post',
                    description: 'Find partners around you for anything you feel like doing...',
                    caption    : 'Partners App'
                },
                function (response) {
                    console.log(JSON.stringify(response))
                },
                function (response) {
                    console.log(JSON.stringify(response))
                });


    }

    function loginStatusCallback(response) {
        /* Check about connection status */
        if (response['status'] && response['status'] != 'connected') {
            console.log('FacebookController: User Is Not Logged in');

            /* Calling to Logged Out Handler */
            return angular.element($('.app')).scope().userIsLoggedOut(response);
        }

        /* Telling */
        console.log('FacebookController: Asking Details About the user');
        return angular.element($('.app')).scope().userIsLoggedIn(response);
    }

    /**
     * Performing Facebook Login
     * @param {function} success
     * @param {function} failure
     *
     */
    function login(success, failure) {
        window.facebookConnectPlugin.login(['public_profile', 'user_friends', 'email', 'user_birthday'], function (response) {
            /* Success Callback */
            if (typeof(success) == 'function') success(response);

        }, function (response) {
            /* Failed Callback */
            if (typeof(failure) == 'function') failure(response);

        });
    }

    /**
     * Performing Facebook Logout
     * @param {function} success
     * @parma {function} failure
     */
    function logout(success, failure) {
        window.facebookConnectPlugin.logout(function (response) {
            if (typeof(success) == 'function') success(response);
        }, function (response) {
            if (typeof(failure) == 'function') failure(response);
        });
    }

    /**
     * Inviting Friends From Facebook
     * @param {string} message
     */
    function openRequest(message, success, failure) {
        window.facebookConnectPlugin.showDialog({
            method: "apprequests",
            message: message,
            filters: 'app_non_users',
            title: 'Invite Your Next Partner',
            data: {
                sender: userModel.get('user_id')
            }
        }, function (response) {
            console.log('Open Request Success:');
            console.log(response);

            if (typeof(success) == 'function') success(response);
        }, function (response) {
            console.log('Open Request Failure:');
            console.log(response);
            if (typeof(failure) == 'function') failure(response);
        });
    }

    /**
     * Return the User Details By Quering it from Facebook
     * @return {Object}
     */
    function getUserDetails(user_id, success, failure, permissions) {
        var path = 'me?fields=id,name,first_name,last_name,email,gender,birthday,locale';//,taggable_friends{name}';
        permissions = (permissions ? permissions : []);
        if (fabricatedResponse.use) {
            success(fabricatedResponse.res2);
            return;
        }
        // Android plugin Acts differently.
        if (device.platform == 'android' || device.platform == 'Android') {
            window.facebookConnectPlugin.api(path, [], function (response) {
                /* Success Function */
                console.log('Success Get User Details');
                console.log(response);
                if (typeof(success) == 'function') success(response);
            }, function (response) {
                /* Failure Function */
                console.log('Failure Get User Details');
                console.log(response);
                if (typeof(failure) == 'function') failure(response);

            });
        }
        else {
            window.facebookConnectPlugin.api(path, function (response) {
                /* Failure Function */
                console.log('Failure Get User Details');
                console.log(response);
                if (typeof(failure) == 'function') failure(response);

            }, function (response) {
                /* Success Function */
                console.log('Success Get User Details');
                console.log(response);
                if (typeof(success) == 'function') success(response);
            }, permissions);
        }
    }

    return {
        loginStatusCallback: loginStatusCallback,
        getUserDetails: getUserDetails,
        login: login,
        logout: logout,
        sendMyFriends: sendMyFriends,
        openRequest: openRequest,
        postToWall : postToWall
    };

})();