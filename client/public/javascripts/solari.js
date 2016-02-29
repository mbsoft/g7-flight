/*!
 * Solari Board jQuery App
 * http://github.com/FogCreek/solari-board
 *
 * Uses jquery.transit.js:
 * http://ricostacruz.com/jquery.transit/
 *
 * date.js:
 * http://www.datejs.com/
 *
 *
 * Copyright © 2013 Fog Creek Software, Inc. All rights reserved.
 *
 * Released under the MIT license
 *
 * INSTRUCTIONS:
 * The solari board app takes an arbitrary json payload from a post command to target url via jsonp (wrapped in a function call)
 * Currently, the solari board assumes a json structure in the following format:
 *    [
 *        {'sDate':'today','sTime':'13:30','sDeparture':'foo@example.com','nStatus':1,'nTrack':17, 'fLight':true},
 *        {'sDate':'yesterday','sTime':'16:00','sDeparture':'bar@example.com','nStatus':2,'nTrack':19, 'fLight':false},
 *        {'sDate':'July 8th, 2013','sTime':'16:30','sDeparture':'baz@example.com','nStatus':2,'nTrack':23, 'fLight':false}
 *    ]
 *
 *  The nStatus field is only used if status_override = false.
 */

// some constants and enums
var RATE_VARIANCE = 4; // for determining random animation rate in milliseconds
var RATE_BASE = 4; // for determining random animation rate in milliseconds
var BOARD_ROWS = 24; // total number of rows displayed on the solari board
var SECOND_SECTION_START = 8; // the first row that contains a next due case
var LETTER_HEIGHT = 26; // height of a single letter frame (in pixels) in the letter image
var FIRST_CHAR_CODE = 32; // the first ASCII character that is represented in the letter image
var LAST_CHAR_CODE = 96; // the last ASCII character that is represented in the letter image
var CHAR_FACTOR = 2; // every N character in the letter image is a "real" character
var IMAGE_HEIGHT = 20; // height of a single product or status image frame (in pixels)
var IMAGE_FACTOR = 2; // every N picture in the letter image is a "real" image (i.e., not an in-between frame)
var DEPARTURE_BOXES = 30; // number of letter boxes displayed in the departure column
var DELAY_BOXES = 4;
var TIME_BOXES = 4; // number of letter boxes displayed in the time column
var RIDES_BOXES = 2;
var RIDER_BOXES = 20;
var ORDERNBR_BOXES = 9;
var INDEX_BOXES = 2;
var SUBSCRIPTION_BOXES = 6;
var REQUESTOR_BOXES = 30;
var DELAY_RED = 15;
var REFRESH_TIME = 20; //refresh time in seconds
var EMPTY_ROW = {
    "status": "",
    "initialtravelarrival": "",
    "delay": "",
    "currentestimatetravelarrival": "",
    "zone": "",
    "nbrtravelers" : ""
};

// Define Moments Locale
moment.locale('fr');
var updated_at = moment();

//if true, the status column will be handled automatically according to time and date. false will override status with nStatus from payload
var status_override = true;
var URL = "/api/v1/travelboard";

//used to add extra params that change over time.  /example_realtime makes use of this
var URL_SUFFIX = "";

var Status = {
    "none": 0,
    "terminated": "TERMINATED",
    "error": "TRAVELID_ERROR",
    "active": "ACTIVE",
    "arrived": "ARRIVED",
    "checked": "CHECKED"
};

var Airports = [
    {"name": "ROISSY AEROPORT", "iata":"CDG"},
    {"name": "ORLY","iata":"ORY"},
    {"name": "ORLY AEROPORT", "iata":"ORY"},
    {"name": "ORLY VILLE","iata":"ORY"}
];


var LAST_STATUS = 4;
var NextDueStatus = ["", "soon", "null", "overdue", ""];
var solari_setup_done = 0;
var syncing = false;
var current_board = [];

//an attempt to reduce slowdown from animations
jQuery.fx.interval = 20;

function ToUpper(code) {
    if (code > 96 && code < 123) {
        code -= 32;
    }
    return code;
}

//constructs the solariBoard within the given div. If no parameter is given, adds the board to "body"
function addSolariBoard(divSelector) {
    if (solari_setup_done === 1) {
        return;
    }

    if (arguments.length === 0) {
        $("body").append("<div id=\"solariBoardDiv\" style=\"width:1300px;margin:0 auto;overflow:hidden\"></div>");
        divSelector = "#solariBoardDiv";
    }

    //The html structure of the solari board. This implementation is pretty ugly, but it's a simple, single-append solution.
    var $solari = $("<div class=\"column solari_grid\">" +
            "<a id='show-solari' href=\"index.html\" onclick=\"localStorage['StopSolari']=0\">Show Solari Board</a>" +
            "<div id=\"solari\" class=\"panel\">" +
            "<div id=\"departures\">" +
            "<header class=\"solari-board-header rounded\"> " +
            "<div class=\"clockContainer\">" +
            "<div class=\"solari-board-icon\"><img src=../images/taxis_g7.png /></div>" +
            "<ul class=\"clockList\">" +
            "<li id=\"hours\"></li>" +
            "<li id=\"point\">H</li>" +
            "<li id=\"min\"></li>" +
            "</ul>" +
            "</div>" +
            "<div id=\"next-due\">" +
            "<p>Next due:</p>" +
            "<div class=\"inner low\">" +
            "<span class=\"clock\">00:00</span>" +
            "<span class=\"today\"></span>" +
            "</div>" +
            "</div>" +
            "</header>" +
            "<ul class=\"solari-board-columns rounded\">" +
            "<li class=\"expander\"></li>" +
            "<li class=\"status\"></li>" +
            "<li class=\"stime\">Scheduled</li>" +
            "<li class=\"delay\">Delay</li>" +
            "<li class=\"atime\">Actual</li>" +
            "<li class=\"departure\">Flight-Departure City</li>" +
            "<li class=\"rides\">Rides</li>" +
            "</ul>" +
            "<ul class=\"solari-board-rows rounded\">" +
            "</ul>" +
            "</div>" +
            "<div id=\"last-updated\">Last updated: <span>n/a</span> (<span id=\"last-updated-human\"></span>)</div>" +
            "</div>" +
            "</div>" +
            "</div>").html();
    //add the board html
    $(divSelector).append($solari);

    //set up clock
    setInterval(function () {
        var hours = moment().format('HH');
        //$("#hours").html(hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours));
        $("#hours").html(hours);
        // Add a leading zero to the minutes value and am/pm
        var minutes = moment().format('mm');
        $("#min").html(minutes);

        $('#last-updated-human').text(updated_at.fromNow());
    }, 1000); // every 1 seconds is plenty accurate


    // show the solari board.
    if (!localStorage['StopSolari'] || localStorage['StopSolari'] === '0') {
        $('#solari').show();
        $('#show-solari').hide();
    } else {
        $('#solari').hide();
        $('#show-solari').show();
        return;
    }

    // Toggle showing the Travel Rows
    $('#solariBoardDiv').on('click', 'li.expander a', function(e){
        e.preventDefault();
        var $button = $(this);
        var rowIndex = $button.closest('li.board-data').attr('id');
        $('#'+rowIndex+' .traveler-expander').slideToggle("fast", function () {
            if ($(this).is(":visible")) {
                $button.html('<i class="fa fa-angle-down fa-2x"></i>');
            } else {
                $button.html('<i class="fa fa-angle-right fa-2x"></i>');
            }
        });
    });

    $('li.track').click(function () {
        updateSolariBoard();
    });

    // we want people who don't care about the solari board to be able to hide it.
    $('#next-due').click(function () {
        localStorage['StopSolari'] = '1';
        $('#solari').hide();
        $('#show-solari').show();
    });
    // and show it
    var $section = $('#departures .solari-board-rows');

    // build the solari board
    for (var add_rows = 0; add_rows < BOARD_ROWS; add_rows++) {
        // initialize the board with default "empty" board data objects
        current_board[add_rows] = EMPTY_ROW;

        // add a row
        appendRow($section, add_rows);
    }
    solari_setup_done = 1;
    window.setInterval(function (){updateSolariBoard()}, 1000 * REFRESH_TIME);
    updateSolariBoard();
}

function NextDue(id, time, offset, add_class) {
    $(id + ' .today').html(offset);
    $(id + ' .clock').html(time);
    $(id + ' .inner').attr('class', 'inner ' + add_class); // reset the applied classes
}

function appendRow(selector, row) {
    selector.append('<li class=board-data id=row' + row +
        '><ul class="master-row"><li class=expander><a href="#" id=expander' + row +
        '><i class=\"fa fa-angle-right fa-2x\"></i></a></li><li class=status><span>' +
        '</span></li><li class=stime></li><li class=delay></li><li class=atime></li>' +
        '<li class=departure></li><li class="rides"></li></ul>' +
        '<div class="traveler-expander"><ul class=\"solari-board-sub-columns rounded sub-header\">' +
        '<li class="index">IDX</li><li class="order">ORDER</li><li class="subscription">ABONNE</li>' +
        '<li class="rider">PASSAGER</li><li class="inittime">INIT TIME</li><li class="nexttime">NEXT TIME</li></ul></div></li>');

    // add the letter boxes in the time column
    for (var add_time_col = 0; add_time_col < TIME_BOXES; add_time_col++) {
        $('#row' + add_rows + ' li.stime').append('<div id=stime-row' + add_rows + 'box' + add_time_col + ' class=letterbox></div>');
        // insert a dot after the second box
        if (add_time_col === 1) {
            $('#row' + add_rows + ' li.stime').append('<div class=dot>H</div>');
        }
    }

    // add the letter boxes in the time column
    for (var add_time_col = 0; add_time_col < TIME_BOXES; add_time_col++) {
        $('#row' + add_rows + ' li.atime').append('<div id=atime-row' + add_rows + 'box' + add_time_col + ' class=letterbox></div>');
        // insert a dot after the second box
        if (add_time_col === 1) {
            $('#row' + add_rows + ' li.atime').append('<div class=dot>H</div>');
        }
    }

    // add the letter boxes in the middle column
    for (var add_cols = 0; add_cols < DELAY_BOXES; add_cols++) {
        $('#row' + add_rows + ' li.delay').append('<div id=delay-row' + add_rows + 'box' + add_cols + ' class=letterbox></div>');
        if (add_cols === 1) {
            $('#row' + add_rows + ' li.delay').append('<div class=dot>H</div>');
        }
    }

    // add the letter boxes in the middle column
    for (var add_cols = 0; add_cols < DEPARTURE_BOXES; add_cols++) {
        $('#row' + add_rows + ' li.departure').append('<div id=departure-row' + add_rows + 'box' + add_cols + ' class=letterbox></div>');
    }

    // add the letter boxes in the rides column
    for (var add_rides_col = 0; add_rides_col < RIDES_BOXES; add_rides_col++) {
        $('#row' + add_rows + ' li.rides').append('<div id=rides-row' + add_rows + 'box' + add_rides_col + ' class=letterbox></div>');
    }
}

function updateSolariTable(board){
    for (var row = 0; row < BOARD_ROWS; row++) {
        if ((board[row] === undefined)) {
            // make this an empty row
            board[row] = EMPTY_ROW;
        }
        // change the row
        UpdateSolariRow(row, current_board[row], board[row]);
    }

    // update the current_row board
    current_board = board;

    // Update 'next due'
    var next_due = 0;
    for (var row = 0; row < BOARD_ROWS; row++) {
        if ((board[row] != undefined) && board[row].status != Status.error && board[row].status != Status.arrived) {
            if (next_due == 0)
                next_due = board[row].origarrtime;
            else if (board[row].arrtime < next_due)
                next_due = board[row].origarrtime;
        }
    }
     if (next_due != undefined)
        NextDue("#next-due", moment(next_due, 'X').format('HH \\H\\ mm','fr'), '', '');

}

function UpdateSolariRow(row, current_row, new_row) {

    var rate = RATE_BASE + Math.random() * RATE_VARIANCE + Math.random() * RATE_VARIANCE + Math.random() * RATE_VARIANCE;

    if (new_row.initialtravelarrival !== "") {
        new_row.initialtravelarrival = moment(new_row.initialtravelarrival, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('HHmm');
    }
    InsertChars('#stime-row' + row, TIME_BOXES, current_row.initialtravelarrival, new_row.initialtravelarrival, new_row);

    if (new_row.travelers == undefined)
        new_row.delay = "    ";
    else if (new_row.delay <= 0)
        new_row.delay = "0000";
    else
        new_row.delay =  padLeft((Math.floor(new_row.delay/60)).toString(), 2) + padLeft((new_row.delay % 60).toString(), 2);

    InsertChars('#delay-row' + row, DELAY_BOXES, current_row.delay, new_row.delay, new_row);

    if (new_row.currentestimatetravelarrival !== "") {
        new_row.currentestimatetravelarrival = moment(new_row.currentestimatetravelarrival, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('HHmm');
    }
    if (new_row.status == 'ARRIVED')
         InsertChars('#atime-row' + row, TIME_BOXES, current_row.currentestimatetravelarrival, new_row.currentestimatetravelarrival, new_row);
    else
        InsertChars('#atime-row' + row, TIME_BOXES, current_row.currentestimatetravelarrival, new_row.currentestimatetravelarrival, new_row);

    // map g7pickupzone to IATA airport code
    if (new_row.travelers != null) {
        Airports.forEach(function(airport){
        if (airport.name == new_row.travelers[0].g7pickupzone)
                new_row.travelers[0].g7pickupzone = airport.iata;
        });
    }

    var current_departure = "";
    var new_departure = "";
    if (new_row.travelers) {
        new_departure = new_row.travelers[0].g7pickupzone +' '+new_row.travelers[0].travelid +' '+new_row.internationalname;
        if (current_row.travelers != undefined)
            current_departure = current_row.travelers[0].g7pickupzone + ' ' + current_row.travelers[0].travelid + ' ' + current_row.internationalname;
    } else {
        new_row = EMPTY_ROW;
        new_departure = "";
        if (current_row.travelers != undefined)
            current_departure = current_row.travelers[0].g7pickupzone + ' ' + current_row.travelers[0].travelid + ' ' + current_row.internationalname;
    }

    if (new_row.status != Status.arrived && new_row.status != Status.error && new_row.status != Status.terminated)
        SpinChars(rate, '#departure-row' + row, DEPARTURE_BOXES, current_departure, new_departure, new_row.delay);
    else
        InsertChars('#departure-row' + row, DEPARTURE_BOXES, current_departure, new_departure, new_row);

    current_row.nbrtravelers = current_row.nbrtravelers === "" ? "" : padLeft(current_row.nbrtravelers, 2);
    new_row.nbrtravelers = new_row.nbrtravelers === "" ? "" : padLeft(new_row.nbrtravelers, 2);
    InsertChars('#rides-row' + row, DELAY_BOXES, current_row.nbrtravelers, new_row.nbrtravelers, new_row);

    // Populate all the subrows
    populateSubRow(row, new_row);

    //clear and apply status class
    var circle = 'circle-green';
    if (new_row.delay <= 0) {
        //Green
        var circle = 'circle-green';
    } else if (new_row.delay > 0 && new_row.delay <= DELAY_RED) {
        // Yellow
        var circle = 'circle-yellow';
    } else {
        // Red > 15
        var circle = 'circle-red';
    }

   $("#row" + row + " ul li.status span").attr('class', 'circle');
   $("#row" + row + " ul li.status span").addClass(circle);
}

// Loop through letter boxes in each row and populate with each charater
function InsertChars(selector_prefix, max_boxes, current_text, new_text, new_row) {
    for (var box = 0; box < max_boxes; box++) {
        var selector = selector_prefix + 'box' + box;

        if (new_text !== undefined) {
            if (new_text === 0) {
                var character = "0";
            } else {
                var character = new_text.toString().charAt(box);
            }
            if (new_row.status == Status.arrived || new_row.status == Status.terminated)
                $(selector).html('<span class="board-arrived-text">'+character+'</span>');
            else if (new_row.status == Status.error)
                $(selector).html('<span class="board-error-text">'+character+'</span>');
            else if (new_row.delay <= 0)
                $(selector).html('<span class="board-green-text">'+character+'</span>');
            else if (new_row.delay > 0 && new_row.delay <= DELAY_RED)
                $(selector).html('<span class="board-yellow-text">'+character+'</span>');
            else
                $(selector).html('<span class="board-red-text">'+character+'</span>');
        } else {
            $(selector).html('<span class="board-text"></span>');
        }
    }
}

function InsertSubChars(selector_prefix, max_boxes, current_text, new_text, status) {
    for (var box = 0; box < max_boxes; box++) {
        var selector = selector_prefix + 'box' + box;

        if (new_text !== undefined) {
            if (new_text === 0) {
                var character = "0";
            } else {
                var character = new_text.toString().charAt(box);
            }

            $(selector).html('<span class="board-sub-text">'+character+'</span>');
        } else {
            $(selector).html('<span class="board-sub-text"></span>');
        }
    }
}

// Loop through letter boxes in each row and populate with each charater
function SpinChars(rate, selector_prefix, max_boxes, current_text, new_text, delay) {
    var num_spins = 0;
    for (var box = 0; box < max_boxes; box++) {
        // get the to and from character codes for this box
        var to_char_code = ToUpper(((new_text.toString().length > box) ? new_text.toString().charCodeAt(box) : 32));
        var from_char_code = ToUpper(((current_text.toString().length > box) ? current_text.toString().charCodeAt(box) : 32));
        var final_pos = '';
        if (from_char_code > to_char_code) {
            // (96 - 56) + (52 - 32) * 2 = 120
            num_spins = ((LAST_CHAR_CODE - from_char_code) + (to_char_code - FIRST_CHAR_CODE)) * CHAR_FACTOR;
            // ((26 * (52 - 32)) * 2) * -1
            final_pos = ((LETTER_HEIGHT * (to_char_code - FIRST_CHAR_CODE)) * CHAR_FACTOR) * -1;
        } else {
            num_spins = (to_char_code - from_char_code) * CHAR_FACTOR;
        }

        var selector = selector_prefix + 'box' + box; // add the box part
        SpinIt(selector, num_spins, rate, LETTER_HEIGHT, final_pos, delay);
    }
}

function SpinIt(selector, num_spins, rate, pixel_distance, final_pos, delay) {
    if (delay > DELAY_RED) {
        $(selector).removeClass('letterbox');
        $(selector).addClass('letterbox-red');
    }
    var bpX = $(selector).css('backgroundPosition').split(' ')[0];
    var bpY = $(selector).css('backgroundPosition').split(' ')[1];
    var updateBpY = function (yDelta) {
        bpY = (parseFloat(bpY) + yDelta) + 'px';
        return bpX + ' ' + bpY;
    };

    for (var ii = 0; ii < num_spins; ii++) {
        $(selector).transition(
            {backgroundPosition: updateBpY(-(pixel_distance * 2))},
            {duration: 1, easing: "linear"}
        );
        $(selector).transition(
            {backgroundPosition: updateBpY(1)},
            {duration: rate, easing: "linear"}
        );
        // on the very last iteration, use a call back to set the background position to the "real" position
        var f = function () {};
        if ((final_pos !== '') && (ii === (num_spins-1))) {
            f = function() {
                $(selector).css('backgroundPosition', bpX + ' ' + final_pos);
            };
        }
        $(selector).transition({backgroundPosition: updateBpY((pixel_distance - 1))}, 1, f);
     }
}

function GetFailBoard() {
    var fail_whale = [];
    fail_whale[0] = "    v  v        v";
    fail_whale[1] = "    !  !  v     !  v";
    fail_whale[2] = "    ! .-, !     !  !";
    fail_whale[3] = " .--./ /  !  _.---.!";
    fail_whale[4] = "  '-. (__..-\"       \\";
    fail_whale[5] = "     \\          &    !";
    fail_whale[6] = "      ',.__.   ,__.-'/";
    fail_whale[7] = "        '--/_.'----''";

    var board = [];
    // update each row on the board
    for (var row = 0; row < BOARD_ROWS; row++) {
        board[row] = {
            "status": "",
            "initialtravelarrival": "",
            "delay": 0,
            "currentestimatetravelarrival": "",
            "zone": fail_whale[row],
            "nbrtravelers": 0,
        };
    }
    return board;
}

function updateSolariBoard() {
    if (syncing) {
        return;
    }
    syncing = true;
    console.log('update solariboard');
    $.getJSON(URL, function(new_board) {
        console.log(new_board);
        syncing = false;
        if (new_board === null) {
            //the last updated footer won't get refreshed, but if data is null, it probably shouldn't
            return;
        }
        //redraw label if recovering from a fail
        $("ul.solari-board-columns li.departure").text("Flight-Departure City");
        if (new_board.length === 0) {
            clearBoard();
        } else {
            //now that the nStatus values have been set, update the board
            updateSolariTable(new_board);
        }
        // update last refresh time text
        $('#last-updated span').fadeOut("slow", function() {
            updated_at = moment();
            $('#last-updated span').html(updated_at.format("LLLL"));
        }).fadeIn("slow");
    }).error(function () {
        syncing = false;
        updateSolariTable(GetFailBoard());
        NextDue("#next-due", '-FA1L-', '', '');
        $("ul.solari-board-columns li.departure").text("FAIL WHALE");
    });
}

function clearBoard() {
    // Clear out all sub rows
    clearSubRows();
    //stop all animations
    $(".status").children().stop(true, true);
    $(".stime").children().stop(true, true);
    $(".delay").children().stop(true, true);
    $(".atime").children().stop(true, true);
    $(".departure").children().stop(true, true);
    $(".rides").children().stop(true, true);
    //clear the next due and all rows
    NextDue("#next-due", '00:00', '', '');
    for (var r = 0; r < BOARD_ROWS; r++) {
        UpdateSolariRow(r, current_board[r], EMPTY_ROW);
        current_board[r] = EMPTY_ROW;
    }
}

function populateSubRow(rowIndex, mainRow){
    // Remove the previous sub-rows since this function recreates them from the travelerData
    clearSubRow(rowIndex);
    travelerData = mainRow.travelers;
    if (travelerData !== undefined) {
        var count = travelerData.length;
        // Loop through the traveler data, generate rows, populate them
        $.each(travelerData, function (index, value) {
            var $rowTemplate = '<ul class="sub-row" id="row'+rowIndex+'sub-row'+index+'"><li class="index"></li><li class="order"></li><li class="subscription"></li><li class="rider"></li><li class="inittime"></li><li class="nexttime"></li></ul>';

            $('#row'+rowIndex+' div.traveler-expander ul.sub-header').after($rowTemplate);


            // add the letter boxes for index
            for (var add_cols = 0; add_cols < INDEX_BOXES; add_cols++) {
                $('#row'+rowIndex+'sub-row'+index+' li.index').append('<div id=index-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
            }

            // add the letter boxes for the TaxiPak order number - last 6 digits (used for searches)
            for (var add_cols = 0; add_cols < ORDERNBR_BOXES; add_cols++) {
                $('#row'+rowIndex+'sub-row'+index+' li.order').append('<div id=order-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
            }

            // add the letter boxes for subscription
            for (var add_cols = 0; add_cols < SUBSCRIPTION_BOXES; add_cols++) {
                $('#row'+rowIndex+'sub-row'+index+' li.subscription').append('<div id=subscription-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
            }

            // add the letter boxes for riders
            for (var add_cols = 0; add_cols < RIDER_BOXES; add_cols++) {
                $('#row'+rowIndex+'sub-row'+index+' li.rider').append('<div id=rider-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
            }


            for (var add_cols = 0; add_cols < TIME_BOXES; add_cols++) {
                $('#row'+rowIndex+'sub-row'+index+' li.inittime').append('<div id=inittime-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
                if (add_cols == 1) {
                    $('#row'+rowIndex+'sub-row'+index+' li.inittime').append('<div class=dot>H</div>');
                }
            }

            for (var add_cols = 0; add_cols < TIME_BOXES; add_cols++) {
                $('#row'+rowIndex+'sub-row'+index+' li.nexttime').append('<div id=nexttime-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
                if (add_cols == 1) {
                    $('#row'+rowIndex+'sub-row'+index+' li.nexttime').append('<div class=dot>H</div>');
                }
            }
            // add the letter boxes for passenger
            //for (var add_cols = 0; add_cols < REQUESTOR_BOXES; add_cols++) {
            //    $('#row'+rowIndex+'sub-row'+index+' li.requestor').append('<div id=requestor-row' + rowIndex + 'box' + add_cols + ' class=subletterbox></div>');
            //}

	        InsertSubChars('#row'+rowIndex+'sub-row'+index+' #index-row'+rowIndex, INDEX_BOXES, '', padLeft(count--, 2), false);

            InsertSubChars('#row'+rowIndex+'sub-row'+index+' #order-row'+rowIndex, ORDERNBR_BOXES, '', value.ridenumber, false);
            // Fill out the letter boxes for SUBSCRIPTION
            InsertSubChars('#row'+rowIndex+'sub-row'+index+' #subscription-row'+rowIndex, SUBSCRIPTION_BOXES, '', value.subscriptioncode, false);
            // Fill out the letter boxes for RIDER
            InsertSubChars('#row'+rowIndex+'sub-row'+index+' #rider-row'+rowIndex, RIDER_BOXES, '', value.refclient, false);

            InsertSubChars('#row'+rowIndex+'sub-row'+index+' #inittime-row'+rowIndex, TIME_BOXES, '', moment(value.initialdueridetimestamp, 'X').format('HHmm','fr'), false);

            InsertSubChars('#row'+rowIndex+'sub-row'+index+' #nexttime-row'+rowIndex, TIME_BOXES, '', moment(value.initialdueridetimestamp+(mainRow.delay*60), 'X').format('HHmm','fr'), false);

            // Fill out the letter boxes for REQUESTOR
            //InsertChars('#row'+rowIndex+'sub-row'+index+' #requestor-row'+rowIndex, REQUESTOR_BOXES, '', value.requestedby, false);
        });
    }
}

// Clear sub-row by parent row index
function clearSubRow(rowIndex) {
    $('#row'+rowIndex+' ul.sub-row').remove();
}

// Clear all sub-rows
function clearSubRows() {
    // Initalize
    $('ul.sub-row').remove();
}

// Padd to the left
// Ex: padLeft(5, 2, 0)
// Gives: 05
function padLeft(nr, n, str) {
    if (nr < 0) //pad negative values with 'space'
        return Array(n-String(nr).length+1).join(str||' ')+nr;
    else
        return Array(n-String(nr).length+1).join(str||'0')+nr;
}
