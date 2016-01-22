/* jshint unused:true, undef:true, node:true */
/* global MAC_ADDRESS */

var Class =  require('./Class');
var APIError = require('./APIError.js');
var logger = require('./logging').logger;
var timeLogger = require("./logging").timeLogger;

var WS3Request = Class.extend({

    // Each route needs a unique name, please override.
    type: 'UNKNOWN',

    maxLimit: 10000,

    // Reserved, created during the lifetime of the request.
    //
    // {string} Which data set do we use for this data set? (For billing.)
    dataSetUsed: null,
    // Performs formatting of the response before request is sent back.
    formatter: null,

    // Reference to express request object.
    request: null,
    // Reference to express response object.
    response: null,
    // {ms since epoch} Total time request took in the backend.
    roundTripTime: null,
    // Reference to Session instance.
    session: null,
    // {ms since epoch} Start time for when we begin processing.
    startTime: null,
    // Unique deCarta ID (helps differentiate each request).
    UDID: null,

    init: function() {
        return this;
    },

    // Entry point for express routing.
    route: function(req, res) {
      debugger;
        var key = req.params.key;
        var ipAddr = req.headers['x-real-ip'];
        var session = req._d_session;
        // Other code still expects this association.
        this.session = session;
        this.request = req;
        this.response = res;

        this.startTime = Date.now();

        // Generate a unique-enough ID for this request.
        if (MAC_ADDRESS) {
            this.UDID = MAC_ADDRESS.slice(-8) + ":" + Date.now().toString().slice(-8);
        } else {
            this.UDID = Date.now().toString(-8);
        }

        //timeLogger.log('info', 'Routing start', {requestId: req.requestId, key: req.params.key, time: this.startTime});

        // Bind to events on either req or res that signal early termination.
        // If sub-classes implement an abort function, it will be called if
        // incoming socket closes early.
        req.on('error', function(e) {
            logger.error('Unexpected error in Request', e);
        });
        res.on('error', function() {
            //This is where I get the CONNECTION RESET, so I can kill the other one.
            //logger.info('Client Connection reset (the browser hung up)', req.params.term);
            if (this.abort) {
                this.abort(req, res);
            }
        }.bind(this));
        res.on('close', function(){
            console.log('******************** CLOSE ********************');
            if (this.abort) {
                console.log('Aborting');
                this.abort();
            }
        }.bind(this));
        res.on('end', function(){
            console.log('******************* CLOSE:END *******************');
            if (this.abort) {
                console.log('Aborting (END)');
                this.abort();
            }
        }.bind(this));
    },

    _respond: function(req, res, data) {
        var key = req.params.key;
        var ipAddr = req.headers['x-real-ip'];

        timeLogger.info('Responding to client',{requestId: req.requestId, key: key, time: Date.now()});
        this.saveTimingStats();

        try {
            if (typeof data === 'function') {
                data();
            } else if (data instanceof APIError) {
                throw data;
            } else {
                if (data && data.summary) {
                   data.summary.queryTime = parseInt(Date.now() - this.startTime);
                }
                this.respond.apply(this, arguments);
            }

            this.roundTripTime = parseInt(Date.now() - this.startTime);

            logger.log('request', 'Processing Request', {
                method: req.method,
                UDID: this.UDID,
                dataset: this._getDataSet(),
                production: this.session.isProduction(),
                type: this.type,
                ip : ipAddr,
                path : req.url,
                key : key,
                cost: this._getWeight(),
                vendorCost: this._getVendorCounts(),
                roundTripTime: this.roundTripTime,
                nonCompQuery: (this.session.appData.nonCompQueryTime && this.roundTripTime > this.session.appData.nonCompQueryTime)? 1: 0
            });

        } catch (e) {
            console.trace(e);
            var err = e;
            var statusCode = 500;
            if (err instanceof APIError) {
                statusCode = err.httpStatusCode;
            } else {
                err = new APIError(500, 'Server Error');
            }
            res.statusCode = statusCode;
            this.formatter(req, res, err);
            logger.error('Server Error', {
                error: e,
                method: req.method,
                type: this.type,
                ip : ipAddr,
                path : req.url,
                key : key,
                err: e
            });
        }
    },

    // {function} Subclasses can implement an abort callback, to be called
    // if the incoming socket is aborted. No arguments are passed to this callback,
    // abort correctly called with instance as this arg.
    abort: null,

    // DEPRECATED.
    // This function is moving from an interface method to an optional
    // "beforeRespond" function. In the mean time, we've made it optional to
    // implement and only needs to be implemented when you want to manipulate
    // the data.
    respond: function(req, res, data){
        this.formatter(req, res, data);
    },

    _execute: function(req, res){
        if (!this.startTime) {
            this.startTime = Date.now();
        }

        timeLogger.info('Executing request to backend',{requestId: req.requestId, key: req.params.key, time: Date.now()});
        this.execute(req, res);
    },

    execute: function(){
        throw Error('Extend this.');
    }
});

module.exports = WS3Request;
