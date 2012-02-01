var path = require('path');
var testUtil = require('./lib/testutil.js');
var requestUtil = require(path.join(testUtil.libdir, 'requestutil.js'));

module.exports = {
  simpleRequest: function(beforeExit, assert) {
    var e = null;
    var d = null;
    var done = false;
    beforeExit(function() {
      assert.equal(e, null);
      assert.notEqual(d, null);
      assert.equal(JSON.parse(d).id, '1055572299');
      assert.ok(done);
    });

    var req = new requestUtil.requestFacebookApi('graph.facebook.com', '/amachang', { method: 'GET' }, function(err, data) {
      e = err;
      d = data;
      done = true;
    });
  },

  constructorAndStart: function(beforeExit, assert) {
    var e = null;
    var d = null;
    var done = false;
    beforeExit(function() {
      assert.equal(e, null);
      assert.notEqual(d, null);
      assert.equal(JSON.parse(d).id, '1055572299');
      assert.ok(done);
    });

    var req = new requestUtil.FacebookApiRequest('graph.facebook.com', '/amachang', { method: 'GET' });
    req.start(function(err, data) {
      e = err;
      d = data;
      done = true;
    });
  },

  responseError: function(beforeExit, assert) {
    var e = null;
    var d = null;
    var done = false;
    beforeExit(function() {
      assert.notEqual(e, null);
      assert.equal(d, null);
      assert.equal(e.code, 'ECONNREFUSED');
      assert.ok(done);
    });

    var req = new requestUtil.FacebookApiRequest('example.com', '/', { method: 'GET' });

    req.start(function(err, data) {
      e = err;
      d = data;
      done = true;
    });
  },

  throwErrorAfterResponse: function(beforeExit, assert) {
    var e = null;
    var d = null;
    var done = false;
    beforeExit(function() {
      assert.notEqual(e, null);
      assert.equal(d, null);
      assert.equal(e.message, 'addListener only takes instances of Function');
      assert.ok(done);
    });

    var req = new requestUtil.FacebookApiRequest('graph.facebook.com', '/amachang', { method: 'GET' });

    // break process
    req.selfBoundDataHandler = null;
    req.start(function(err, data) {
      e = err;
      d = data;
      done = true;
    });
  },

  dataError: function(beforeExit, assert) {
    var e = null;
    var d = null;
    var done = false;
    beforeExit(function() {
      assert.notEqual(e, null);
      assert.equal(d, null);
      assert.equal(e.message, 'dummy');
      assert.ok(done);
    });

    var req = new requestUtil.FacebookApiRequest('graph.facebook.com', '/amachang', { method: 'GET' });

    req.afterResponse_ = req.afterResponse;
    req.afterResponse = function() {
      process.nextTick(function() {
        req.handleDataError(new Error('dummy'));
      });
      return req.afterResponse_.apply(this, arguments);
    };

    req.start(function(err, data) {
      e = err;
      d = data;
      done = true;
    });
  },

  throwErrorInEndData: function(beforeExit, assert) {
    var e = null;
    var d = null;
    var done = false;
    beforeExit(function() {
      assert.notEqual(e, null);
      assert.equal(d, null);
      assert.ok(done);
    });

    var req = new requestUtil.FacebookApiRequest('graph.facebook.com', '/amachang', { method: 'GET' });

    req.detachDataAndEndAndErrorHandlers = null;
    req.start(function(err, data) {
      e = err;
      d = data;
      done = true;
    });
  }
};
