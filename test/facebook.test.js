var path = require('path');
var fs = require('fs');
var assert = require('assert');
var express = require('express');

var basedir = path.join(__dirname, '..');
var covdir = path.join(basedir, 'lib-cov');
var libdir = path.join(basedir, 'lib');

try {
  var stat = fs.statSync(covdir);
  if (stat.isDirectory()) {
    libdir = covdir;
  }
}
catch (e) {
}

var Facebook = require(path.join(libdir, 'facebook.js'));

assert.ok('TEST_FB_APP_ID' in process.env);
assert.ok('TEST_FB_SECRET' in process.env);

var config = {
  appId: process.env.TEST_FB_APP_ID,
  secret: process.env.TEST_FB_SECRET
};

module.exports = {

  middleware: function(beforeExit, assert) {
    var done = false;
    beforeExit(function() { assert.ok(done) });

    var app = express.createServer();
    app.configure(function () {
      app.use(express.bodyParser());
      app.use(express.cookieParser());
      app.use(express.session({ secret: 'foo bar' }));
      app.use(Facebook.middleware(config));
    });

    app.get('/', function(req, res) {
      if (req.facebook) {
        res.send('ok');
      }
      else {
        res.send('ng');
      }
    });

    assert.response(app, { url: '/' }, function(res) {
      assert.equal(res.body, 'ok');
      done = true;
    });
  },

  loginRequired: function(beforeExit, assert) {
    var done = false;
    beforeExit(function() { assert.ok(done) });

    var app = express.createServer();
    app.configure(function () {
      app.use(express.bodyParser());
      app.use(express.cookieParser());
      app.use(express.session({ secret: 'foo bar' }));
      app.use(Facebook.middleware(config));
    });

    app.get('/', Facebook.loginRequired(), function(req, res) {
      req.facebook.getUser(function(err, user) {
        res.send(user);
      });
    });

    assert.response(app, { url: '/' }, function(res) {
      assert.equal(res.statusCode, 302);
      done = true;
    });
  }
};


