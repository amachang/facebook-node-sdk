var util = require('util');

var BaseFacebook = require(__dirname + '/basefacebook.js');

function Facebook(config) {
  this.hasSession = !!(config.request && config.request.session);
  BaseFacebook.apply(this, arguments);
}

util.inherits(Facebook, BaseFacebook);

Facebook.prototype.setPersistentData = function(key, value) {
  if (this.hasSession) {
    this.request.session[key] = value;
  }
};

Facebook.prototype.getPersistentData = function(key, defaultValue) {
  if (this.hasSession) {
    return this.request.session[key] || defaultValue;
  }
  return false;
};

Facebook.prototype.clearPersistentData = function(key) {
  if (this.hasSession) {
    delete this.request.session[key];
  }
};

Facebook.prototype.clearAllPersistentData = function() {
  if (this.hasSession) {
    for (var name in this.request.session) {
      this.clearPersistentData(name);
    }
  }
};

Facebook.middleware = function(config) {
  return function(req, res, next) {
    config.request = req;
    req.facebook = new Facebook(config);
    next();
  }
};

Facebook.loginRequired = function(config) {
  return function(req, res, next) {
    if (!req.facebook) {
      Facebook.middleware(config)(req, res, afterNew);
    }
    else {
      afterNew();
    }
    function afterNew() {
      req.facebook.getUser(function(err, user) {
        if (err) {
          next(err);
          next = null;
        }
        else {
          if (user === 0) { 
            res.redirect(req.facebook.getLoginUrl(config));
          }
          else {
            next();
            next = null;
          }
        }
      });
    }
  };
};

module.exports = Facebook;

