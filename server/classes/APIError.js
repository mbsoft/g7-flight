var APIError = function(httpStatusCode, errorText, errorCode){
	this.httpStatusCode =  httpStatusCode || 500;
	this.errorText = errorText || 'Server Error';
};

module.exports = APIError;
