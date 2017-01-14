var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require(path.join(__dirname, 'server', 'classes','logging')).logger;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./server/routes/index');
var apiroutes = require('./server/routes/api/index');
var testroutes = require('./server/routes/test/index');

var flightcheck = require('./server/routes/flightcheck');
var traveler2check = require('./server/routes/traveler2check');
var traincheck = require('./server/routes/traincheck');

var cleanup = require('./server/routes/cleanup');
var moment = require('moment');
var app = express();
var env = process.env.G7TRAVEL_ENV;
var config = require(path.join(__dirname, './','server', 'config/'+env+'.js'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, './client', 'public')));

app.use('/', routes);
app.use('/api', apiroutes);
app.use('/test', testroutes);

config.init();
// Allows us to run g7-flight as just a client service for the travelboard
//if (!config.debug) {
  traveler2check.init();
  flightcheck.init();
  traincheck.init();
//}
//traveler2check.init();
cleanup.init();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not x Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  logger.info('Whoops....something went wrong with request ' + err.status);
  res.status(err.status || 500);
});


module.exports = app;
