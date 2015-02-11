/**
 * Created by admin on 2/10/2015.
 */
function initActivitiesTab() {
    $('.dropdown')
        .dropdown({
            // you can use any ui transition
            transition: 'drop'
        });

    $("#activitySearch").keyup(function (event) {
        if (event.keyCode == 13) {
            searchMain();
        }
    });

    $('#search').click(searchMain);

}
var searchNumber = 0;

function searchMain() {
    searchNumber = 0;
    search( {
        parentOnly  : $('#parents').html(),
        searchStr   : $('#activitySearch').val(),
        hasChildren : $('#hasChildren').html(),
        searchNumber: searchNumber++
    });
}

function search(params, callback) {
    console.log('search');
    $.ajax({
        data   : params,
        url    : document.URL.split('admin')[0] + 'activity/searchActivities/',
        success: function (activities) {
            var list = $('#listActivities');
            if (callback) callback ();
            for (var i = 0; i < activities.length; i++)
                list.append(returnActivitiesRow(activities[i]));
                list.append(returnMoreButton(params, 'More'));
            if (params.searchNumber > 1)
                list.append(returnMoreButton(params, 'Less'));


        }
    });
}

function returnActivitiesRow(activity) {

    var row = $('<div>').addClass('item').attr('id', activity.activity_id);
    var content = $('<div>').addClass('content');
    var sendTo = $('<div>').addClass('right floated compact ui button BtnSendto')
        .html('sendTo')
        .attr('id', activity.activity_id + 'BtnSendto')
        .attr('style', 'display:none');
    var sendFrom = $('<div>').addClass('right floated compact  ui button BtnFromto')
        .html('Delete')
        .attr('id', activity.activity_id + 'BtnFromto');
    var header = $('<div>').addClass('header').html(activity.activity);
    content.append(header);
    row.append(content);
    row.append(sendTo);
    row.append(sendFrom);
    return row;

}
function returnMoreButton(params, more) {

    var row = $('<div>').addClass('item').attr('id', 'btnMore')
        .attr('parentOnly', params.parentOnly)
        .attr('searchStr', params.searchStr)
        .attr('hasChildren', params.hasChildren)
        .attr('searchNumber', params.searchNumber+1);
    var moreBtn = $('<div>').addClass('right floated compact  ui button BtnFromto')
        .html(more)
        .attr('id', 'BtnMore')
        .bind('click', moreBtnf);
    row.append(moreBtn);
    return row;

}
function moreBtnf ()
{
    var moreOrLess = $(this).html();
    console.log('moreBtn');
    var row = $(this).parent();
    if (moreOrLess == 'More')
        search({
            parentOnly : row.attr('parentOnly'),
            searchStr : row.attr('searchStr'),
            hasChildren : row.attr('hasChildren'),
            searchNumber : Number (row.attr('searchNumber')) + 1
        }, function () {
            row.remove();
        });
    else
    {
        var bigList = $('#listActivities').children();
        for (var i = bigList.length - 1; i > bigList.length - 10; i--) {
            $(bigList[i]).remove();

        }
    }
}
