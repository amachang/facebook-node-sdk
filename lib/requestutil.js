
var assert = require('assert');
var querystring = require('querystring');

exports.requestFacebookApi = function(http, host, port, path, params, callback) {
  var req = new FacebookApiRequest(http, host, port, path, params);
  req.start(callback);
};

// export for debug
exports.FacebookApiRequest = FacebookApiRequest;

function bindSelf(self, fn) {
  return function selfBoundFunction() {
    return fn.apply(self, arguments);
  };
}

function FacebookApiRequest(http, host, port, path, params) {
  assert.equal(this.postData, null);
  assert.equal(this.options, null);
  assert.equal(this.http, null);

  // TODO request timeout setting
  // TODO user agent setting
  // TODO support multipart/form-data

  // Querystring is encoding multibyte as utf-8.
  this.postData = querystring.stringify(params);

  // PostData must not have multibyte data.
  var postDataLength = this.postData.length;

  this.options = {
    host: host,
    path: path,
    port: port,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postDataLength
    }
  };

  this.http = http;

  this.selfBoundResponseErrorHandler = bindSelf(this, this.handleResponseError);
  this.selfBoundResponseHandler = bindSelf(this, this.handleResponse);
  this.selfBoundDataHandler = bindSelf(this, this.handleData);
  this.selfBoundDataErrorHandler = bindSelf(this, this.handleDataError);
  this.selfBoundEndHandler = bindSelf(this, this.handleEnd);
}

FacebookApiRequest.prototype.postData = null;
FacebookApiRequest.prototype.options = null;
FacebookApiRequest.prototype.http = null;
FacebookApiRequest.prototype.callback = null;
FacebookApiRequest.prototype.selfBoundResponseErrorHandler = null;
FacebookApiRequest.prototype.selfBoundResponseHandler = null;
FacebookApiRequest.prototype.selfBoundDataHandler = null;
FacebookApiRequest.prototype.selfBoundDataErrorHandler = null;
FacebookApiRequest.prototype.selfBoundEndHandler = null;

FacebookApiRequest.prototype.start = function(callback) {
  assert.equal(this.req, null);
  assert.notEqual(this.options, null);
  assert.notEqual(this.postData, null);
  assert.equal(this.callback, null);

  this.callback = callback;

  this.req = this.http.request(this.options);
  this.req.on('error', this.selfBoundResponseErrorHandler);
  this.req.on('response', this.selfBoundResponseHandler);
  this.req.end(this.postData);
};

FacebookApiRequest.prototype.req = null;

FacebookApiRequest.prototype.handleResponse = function(res) {
  assert.notEqual(this.callback, null);

  try {
    this.detachResponseAndErrorHandlers();
    this.afterResponse(res);
  }
  catch (err) {
    this.callback(err, null);
  }
};

FacebookApiRequest.prototype.handleResponseError = function (err) {
  assert.notEqual(this.callback, null);

  this.callQuietly(this.detachResponseAndErrorHandlers);
  this.callQuietly(this.abortRequest);
  this.callback(err, null);
};

FacebookApiRequest.prototype.detachResponseAndErrorHandlers = function() {
  assert.notEqual(this.req, null);

  this.req.removeListener('error', this.selfBoundResponseErrorHandler);
  this.req.removeListener('response', this.selfBoundResponseHandler);
};

FacebookApiRequest.prototype.afterResponse = function(res) {
  assert.equal(this.res, null);
  assert.equal(this.responseBody, null);

  this.res = res;
  this.res.setEncoding('utf8');
  this.responseBody = [];
  this.res.on('data', this.selfBoundDataHandler);
  this.res.on('error', this.selfBoundDataErrorHandler);
  this.res.on('end', this.selfBoundEndHandler);
};

FacebookApiRequest.prototype.res = null;
FacebookApiRequest.prototype.responseBody = null;

FacebookApiRequest.prototype.handleData = function(data) {
  assert.notEqual(this.responseBody, null);

  this.responseBody.push(data);
};

FacebookApiRequest.prototype.handleDataError = function (err) {
  this.callQuietly(this.detachDataAndEndAndErrorHandlers);
  this.callQuietly(this.abortRequest);
  this.callback(err, null);
};

FacebookApiRequest.prototype.handleEnd = function() {
  assert.notEqual(this.responseBody, null);
  assert.notEqual(this.callback, null);

  try {
    this.detachDataAndEndAndErrorHandlers();
    this.callback(null, this.responseBody.join(''));
  }
  catch (err) {
    this.callback(err, null);
  }
};

FacebookApiRequest.prototype.detachDataAndEndAndErrorHandlers = function() {
  this.res.removeListener('data', this.selfBoundDataHandler);
  this.res.removeListener('error', this.selfBoundDataErrorHandler);
  this.res.removeListener('end', this.selfBoundEndHandler);
};

FacebookApiRequest.prototype.abortRequest = function() {
  assert.notEqual(this.req, null);
  this.req.abort();
};

FacebookApiRequest.prototype.callQuietly = function() {
  try {
    var args = [].slice.call(arguments);
    var fn = args.shift();
    return fn.apply(this, args);
  }
  catch (err) {
    // ignore error
  }
};
