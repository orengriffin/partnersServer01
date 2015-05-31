/* Facebook Controller */

var fbController = (function () {
    var queue = {
        funcArray : [],
        add: function () {
            debugger;
            this.funcArray.push({func:arguments[0], arguments:arguments[1]});
        },
        run: function () {
            for (var i = 0; i < this.funcArray; i++) {
                this.funcArray[i].func.apply(this.funcArray[i].arguments);
            }
        }
    };

    var path = 'me?fields=id,name,first_name,last_name,email,gender,birthday,locale';//,taggable_friends{name}';

    function init () {
        function statusChangeCallback(response) {
            console.log('statusChangeCallback');
            console.log(response);
            // The response object is returned with a status field that lets the
            // app know the current login status of the person.
            // Full docs on the response object can be found in the documentation
            // for FB.getLoginStatus().
            if (response.status === 'connected') {
                // Logged into your app and Facebook.
                testAPI();
            } else if (response.status === 'not_authorized') {
                // The person is logged into Facebook, but not your app.
                console.log('Please log into this app.') ;
            } else {
                // The person is not logged into Facebook, so we're not sure if
                // they are logged into this app or not.
                console.log('Please log into Facebook.') ;
            }
        }

        // This function is called when someone finishes with the Login
        // Button.  See the onlogin handler attached to it in the sample
        // code below.

        window.fbAsyncInit = function() {
            console.log('fb init');
            FB.init({
                appId      : fbid,
//            cookie     : true,  // enable cookies to allow the server to access
                // the session
                xfbml      : true,  // parse social plugins on this page
                version    : 'v2.3' // use version 2.1
            });
            window.facebookConnectPlugin = FB;
            queue.run();
            fbController.getLoginStatus(fbController.loginStatusCallback, fbController.loginStatusCallback);


            // Now that we've initialized the JavaScript SDK, we call
            // FB.getLoginStatus().  This function gets the state of the
            // person visiting this page and can return one of three states to
            // the callback you provide.  They can be:
            //
            // 1. Logged into your app ('connected')
            // 2. Logged into Facebook, but not your app ('not_authorized')
            // 3. Not logged into Facebook and can't tell if they are logged into
            //    your app or not.
            //
            // These three cases are handled in the callback function.
/*

            FB.getLoginStatus(function(response) {
                debugger;
                statusChangeCallback(response);
            });
*/

        };

        // Load the SDK asynchronously

        // Here we run a very simple test of the Graph API after login is
        // successful.  See statusChangeCallback() for when this call is made.
        function testAPI() {
            console.log('Welcome!  Fetching your information.... ');
            FB.api('/me', function(response) {
                debugger;
                console.log('Successful login for: ' + response.name);
                document.getElementById('status').innerHTML =
                    'Thanks for logging in, ' + response.name + '!';
            });
        }

    }

    function checkLoginState(callback) {
        if (!FB) {
            queue.add (checkLoginState, arguments);
        }

        FB.getLoginStatus(function(response) {
            callback(response);
            //statusChangeCallback(response);
        });
    }

    function sendMyFriends() {
        if (!FB) {
            queue.add (sendMyFriends, arguments);
            return;
        }
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
            window.facebookConnectPlugin.api('me/friends?limit=5000', [], function (res) {
                console.log(res);
            }, successFunc);
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
        FB.login (function (response) {
            /* Success Callback */
            if (typeof(success) == 'function') success(response);

        }, function (response) {
            /* Failed Callback */
            if (typeof(failure) == 'function') failure(response);

        }, {scope:path});
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

        permissions = (permissions ? permissions : []);
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
        init:init,
        getLoginStatus: checkLoginState,
        loginStatusCallback: loginStatusCallback,
        getUserDetails: getUserDetails,
        login: login,
        logout: logout,
        sendMyFriends: sendMyFriends,
        openRequest: openRequest,
        postToWall : postToWall
    };

})();