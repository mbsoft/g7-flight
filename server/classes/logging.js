/* jshint unused:true, undef:true, node:true */

// Logging configuration and custom logging objects.
// Require this module during initialization to correctly setup loggers.

var path = require("path");
var os = require("os");
// We configure, and then export, the default winston logger.
var logger = require("winston");
var env = process.env.G7TRAVEL_ENV;
var config = require(path.join(__dirname, '../', 'config/'+env+'.js'));
// Winston configuration. This will be taken care of when this module is
// first required, even if nothing is used from it.
// Additional log level of "requests" above standard to allow requests to
// be captured separately and no matter what other log level is set.
var loggerLevels = {
    silly: 0,
    verbose: 1,
    debug: 2,
    info: 3,
    warn: 4,
    error: 5,
    request: 6
};

// Localize reference to config since logging might be required in
// certain test situations where CONFIG is not actually global.


// Base directory where we output logs to.
// Normalize logging directory.
var logDirectory = config.logDirectory || os.tmpdir();
var logLevel = config.logLevel || "info";

// Anything equal to or greater than the log level enum will be caught.
// Note: Do this before configuring different transports as winston
// seems to override all transports with this level if set later.
logger.level = logLevel;

// From here on, use
logger.remove(logger.transports.Console);
logger.setLevels(loggerLevels);
logger.addColors({request: 'magenta'});
logger.add(logger.transports.Console, {
    level: logLevel || "info",
    colorize: true
});

logger.add(logger.transports.File, {
    // Friendly to trailing or non trailing slash configs.
    filename: path.join(logDirectory, "request.log"),
    maxsize: 100000000,
    colorize: false,
    json: false,
    level: 'request'
});


// Enumerate a log level by value. Returns a value of 0 if level can't be
// detected.
logger.logLevelEnum = function(level) {
    return this.levels[level] || 0;
};
// Extend to get numeric value of current log level.
logger.logLevelValue = function () {
    return this.levels[this.level];
};

logger.info("Writing logs to: ", logDirectory);
logger.info("Running at log level " + logger.logLevelValue() + " === " + logger.level);
exports.logger = logger;



// Custom logger used for timings.
var timeLogger = new (logger.Logger)({
    transports: [
        new (logger.transports.Console)({colorize: true}),
        new (logger.transports.File)({
            json:true,
            filename: path.join(config.logDirectory || os.tmpdir(), "timing.log"),
            colorize: false,
        })
    ]
});
timeLogger.info = function(msg, meta){
    this.log('info',msg,meta);
};
exports.timeLogger = timeLogger;
