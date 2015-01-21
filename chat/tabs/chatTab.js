/**
 * Created by admin on 1/21/2015.
 */
function initChatTab() {
    $('.dropdown')
        .dropdown({
            // you can use any ui transition
            transition: 'drop'
        });
    $('#send').click(onSend);
}

function onSend() {
    var canSend = true;
    var sender = $('#sender').val();
    var recipient = $('#recipient').val();
    var message = $('#message').val();
    var save = $($('.text')[0]).html();
    var type = $($('.text')[1]).html();
    var relation = $($('.text')[2]).html();

    if (sender == recipient) {
        $('#response').append(' <br>cant send to self <br>');
        canSend = false;
    }
    if (sender == "") {
        $('#response').append(' <br> sender cant be empty <br>');
        canSend = false;
    }
    if (isNaN(sender)) {
        $('#response').append(' <br> Sender Must be a Number <br>');
        canSend = false;
    }
    if (isNaN(recipient)) {
        $('#response').append(' <br> recipient Must be a Number <br>');
        canSend = false;
    }

    if (recipient == "") {
        $('#response').append(' <br> recipient cant be empty <br>');
        canSend = false;
    }
    if (message == "") {
        $('#response').append(' <br> message cant be empty <br>');
        canSend = false;
    }

    if (save == 'Save Message') {
        $('#response').append(' <br> Choose if to save the message <br>');
        canSend = false;
    }

    if (type == 'Type') {
        $('#response').append(' <br> Choose type of meesage <br>');
        canSend = false;
    }

    if (relation == 'Relation') {
        $('#response').append(' <br> Choose Relation <br>');
        canSend = false;
    }


    /*
     if (!!Number(recipient))
     $('#response').append(' <br> recipient cant be empty <br>');
     */
    if (canSend)
        $.ajax({
            url    : 'http://localhost:3010/chat/sendMessage/dev',
            type   : 'POST',
            data   : {
                sender   : sender,
                recipient: recipient,
                type     : type,
                toSave   : (save == 'True'),
                message: message,
                relation: relation
            },
            success: function (response) {
                $('#response').append(' <br>' + response + ' <br>');


            }
        });
    console.log(sender + ' ' + recipient + ' ' + message + ' ' + save + ' ' + type);
    //debugger;
}