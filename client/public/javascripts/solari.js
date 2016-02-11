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
var RATE_VARIANCE = 8; // for determining random animation rate in milliseconds
var RATE_BASE = 8; // for determining random animation rate in milliseconds
var BOARD_ROWS = 16; // total number of rows displayed on the solari board
var SECOND_SECTION_START = 8; // the first row that contains a next due case
var LETTER_HEIGHT = 26; // height of a single letter frame (in pixels) in the letter image
var FIRST_CHAR_CODE = 32; // the first ASCII character that is represented in the letter image
var LAST_CHAR_CODE = 96; // the last ASCII character that is represented in the letter image
var CHAR_FACTOR = 2; // every N character in the letter image is a "real" character
var IMAGE_HEIGHT = 20; // height of a single product or status image frame (in pixels)
var IMAGE_FACTOR = 2; // every N picture in the letter image is a "real" image (i.e., not an in-between frame)
var DEPARTURE_BOXES = 32; // number of letter boxes displayed in the departure column
var DELAY_BOXES = 2;
var TIME_BOXES = 4; // number of letter boxes displayed in the time column
var RIDES_BOXES = 2;
var ATIME_BOXES = 4;
var TRACK_BOXES = 2; // number of letter boxes displayed in the track column
var REFRESH_TIME = 60; //refresh time in seconds
var EMPTY_ROW = {
    "status": "",
    "origarrtime": "",
    "delay": "",
    "arrtime": "",
    "zone": "",
    "nbrtravelers" : ""
};

// Define Moments Locale
moment.locale('fr');

//if true, the status column will be handled automatically according to time and date. false will override status with nStatus from payload
var status_override = true;
var URL = "/api/v1/travelboard";

//used to add extra params that change over time.  /example_realtime makes use of this
var URL_SUFFIX = "";

var Status = {
    "none": 0,
    "all_aboard": 1,
    "on_time": 2,
    "delayed": 3,
    "departed": 4
};

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
    console.log('add solari board');
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
            "<div class=\"solari-board-icon\">Travel Monitor</div>" +
            "<div class=\"clockContainer\">" +
            "<ul class=\"clockList\">" +
            "<li id=\"hours\">12</li>" +
            "<li id=\"point\">:</li>" +
            "<li id=\"min\">00</li>" +
            "<li id=\"ampm\"> pm</li>" +
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
            "<div id=\"last-updated\">Last updated: <span>n/a</span></div>" +
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

        // Set am/pm
        $("#ampm").html(moment().format('a'));
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

    $('#solariBoardDiv').on('click', 'li.expander a', function(e){
        e.preventDefault();
        showTravelers($(this).find('tr'));
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
    var $section;

    // build the solari board
    for (var add_rows = 0; add_rows < BOARD_ROWS; add_rows++) {
        // initialize the board with default "empty" board data objects
        current_board[add_rows] = EMPTY_ROW;

        if ($section === undefined) {
            $section = $('#departures .solari-board-rows');
        }
        // add a row
        $section.append('<li class=board-data id=row' + add_rows + '><ul><li class=expander><a href="#" id=expander' + add_rows + '><i class=\"fa fa-angle-right fa-2x\"></i></a></li><li class=status></li><li class=stime></li><li class=delay></li><li class=atime></li><li class=departure></li><li class="rides"></li></ul></li>');

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
    solari_setup_done = 1;
    window.setInterval(function (){updateSolariBoard()}, 1000 * REFRESH_TIME);
    updateSolariBoard();
}

function NextDue(id, time, offset, add_class) {
    $(id + ' .today').html(offset);
    $(id + ' .clock').html(time);
    $(id + ' .inner').attr('class', 'inner ' + add_class); // reset the applied classes
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
}

function UpdateSolariRow(row, current_row, new_row) {

    if (typeof current_row.arrtime == 'number' && current_row.arrtime != "") {
        current_row.arrtime = moment(current_row.arrtime, 'x').format('HHmm');
    }
    if (typeof current_row.arrtime == 'number' && current_row.arrtime != "") {
        new_row.arrtime = moment(new_row.arrtime, 'x').format('HHmm');
    }
    InsertChars('#stime-row' + row, TIME_BOXES, current_row.arrtime, new_row.arrtime);

    current_row.delay = current_row.delay === "" ? "" : padLeft(current_row.delay, 2);
    new_row.delay = new_row.delay === "" ? "" : padLeft(new_row.delay, 2);
    InsertChars('#delay-row' + row, DELAY_BOXES, current_row.delay, new_row.delay);

    if (typeof current_row.origarrtime == 'number' && current_row.origarrtime != "") {
        current_row.origarrtime = moment(current_row.origarrtime, 'x').format('HHmm');
    }
    if (typeof current_row.origarrtime == 'number' && current_row.origarrtime != "") {
        new_row.origarrtime = moment(new_row.origarrtime, 'x').format('HHmm');
    }
    InsertChars('#atime-row' + row, TIME_BOXES, current_row.origarrtime, new_row.origarrtime);
    InsertChars('#departure-row' + row, DEPARTURE_BOXES, current_row.zone, new_row.zone);

    current_row.nbrtravelers = current_row.nbrtravelers === "" ? "" : padLeft(current_row.nbrtravelers, 2);
    new_row.nbrtravelers = new_row.nbrtravelers === "" ? "" : padLeft(new_row.nbrtravelers, 2);
    InsertChars('#rides-row' + row, DELAY_BOXES, current_row.nbrtravelers, new_row.nbrtravelers);

    //clear and apply light class
   // $("#row" + row + " span").attr('class', 'circle');
   // $("#row" + row + " span").addClass(new_row.bLight ? 'circle-on' : 'circle');
}

function InsertChars(selector_prefix, max_boxes, current_text, new_text) {
    for (var box = 0; box < max_boxes; box++) {
        var selector = selector_prefix + 'box' + box;

        if (new_text !== undefined) {
            if (new_text === 0) {
                var character = "0";
            } else {
                var character = new_text.toString().charAt(box);
            }
            $(selector).html('<span class="board-text">'+character+'</span>');
        } else {
            $(selector).html('<span class="board-text"></span>');
        }
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
            "origarrtime": "",
            "delay": 0,
            "arrtime": "",
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
            //the next due box should display information on the row for which time info is available, which may not be from the first case
            var i, stime, atime;
            for (i=0; i < BOARD_ROWS; i++) {
                stime = new_board[i].origarrtime;
                atime = new_board[i].arrtime;
                if (typeof stime !== "undefined" && stime !== "" ||
                    typeof atime !== "undefined" && atime !== "")
                    break;
            }
            var next_due_row = new_board[i];

            if (stime) {
                var now = moment();
                var momentStime = moment(next_due_row.origarrtime, 'x');
                var timeDelta = now.diff(momentStime);
                var nOffset = timeDelta > 0 ? Math.floor(timeDelta / (1000 * 60 * 60 * 24)) : Math.ceil(timeDelta / (1000 * 60 * 60 * 24)); //divide by miliseconds per day and round to zero
                var sOffset = (nOffset === 0 ? "" : nOffset.toString() + "d"); //if next due is not today, append a "d"
                if(status_override) {
                    var hrsDelta = momentStime.diff(now, 'hours');
                    nOffset += timeDelta < 0 ? -1 : 0; // if the time difference is negative, which means we are within 24 hours of due, so reduce day offset by 1
                    if (nOffset < 0) {
                        new_board[0].nStatus = 3; // if we've past the due date
                    } else if (nOffset === 0 && hrsDelta < 2 && hrsDelta >= 0 ) {
                        new_board[0].nStatus = 1; //due within 2 hours
                    } else {
                        new_board[0].nStatus = 2;
                    }
                }
            }

            if (atime) {
                var now = moment();
                var momentAtime = moment(next_due_row.arrtime, 'x');
                var timeDelta = now.diff(momentAtime);
                var nOffset = timeDelta > 0 ? Math.floor(timeDelta / (1000 * 60 * 60 * 24)) : Math.ceil(timeDelta / (1000 * 60 * 60 * 24)); //divide by miliseconds per day and round to zero
                var sOffset = (nOffset === 0 ? "" : nOffset.toString() + "d"); //if next due is not today, append a "d"
                if(status_override) {
                    var hrsDelta = momentAtime.diff(now, 'hours');
                    nOffset += timeDelta < 0 ? -1 : 0; // if the time difference is negative, which means we are within 24 hours of due, so reduce day offset by 1
                    if (nOffset < 0) {
                        new_board[0].nStatus = 3; // if we've past the due date
                    } else if (nOffset === 0 && hrsDelta < 2 && hrsDelta >= 0 ) {
                        new_board[0].nStatus = 1; //due within 2 hours
                    } else {
                        new_board[0].nStatus = 2;
                    }
                }
            }

            //now that the nStatus values have been set, update the board
            updateSolariTable(new_board);
        }
        // update last refresh time text
        $('#last-updated span').fadeOut("slow", function() {
            var now = moment();
            $('#last-updated span').html(now.format("LLLL"));
        }).fadeIn("slow");
    }).error(function () {
        syncing = false;
        updateSolariTable(GetFailBoard());
        NextDue("#next-due", '-FA1L-', '', '');
        $("ul.solari-board-columns li.departure").text("FAIL WHALE");
    });
}

function clearBoard() {
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

function showTravelers(row) {
    // Placeholder for stuff to come
    console.log(row);
}

function padLeft(nr, n, str){
    return Array(n-String(nr).length+1).join(str||'0')+nr;
}
