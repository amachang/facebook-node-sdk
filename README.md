# Facebook Node SDK

Facebook API Implementation in Node.

[![Build Status](https://secure.travis-ci.org/amachang/facebook-node-sdk.png)](http://travis-ci.org/amachang/facebook-node-sdk)

## Features

* Supports all Facebook Graph API, FQL, and REST API.
* Compatible with the official Facebook PHP SDK.

## Install

To install the most recent release from npm, run:

    npm install facebook-node-sdk

## Synopsis

    var Facebook = require('facebook-node-sdk');
    
    var facebook = new Facebook({ appID: 'YOUR_APP_ID', secret: 'YOUR_APP_SECRET' });
    
    facebook.api('/amachang', function(err, data) {
      console.log(data); // => { id: ... }
    });

### With express 4x framework

    var express = require('express');
    var Facebook = require('facebook-node-sdk');
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var expressSession = require('express-session');
    
    var app = express();
    
    app.use(bodyParser());
    app.use(cookieParser());
    app.use(expressSession({ secret: 'foobar' }));
    app.use(Facebook.middleware({appId:'YOUR_APP_ID',secret:'YOUR_APP_SECRET'}));

    app.get('/', Facebook.loginRequired(), function (req, res) {
    
      	req.facebook.api('/me', function(err, user) {
        res.send('Hello, ' + user.name + '!');
      });
    });
    
    app.listen(8080, '127.0.0.1');
