var nodeunit = require('nodeunit');
var path = require('path');
var util = require('util');
var assert = require('assert');
var url = require('url');
var BaseFacebook = require(path.join(__dirname, '..', '..', 'lib', 'basefacebook.js'));

assert.ok('TEST_FB_APP_ID' in process.env);
assert.ok('TEST_FB_SECRET' in process.env);

var config = {
  appId: process.env.TEST_FB_APP_ID,
  secret: process.env.TEST_FB_SECRET
};

module.exports = nodeunit.testCase({

  constructor: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });
    test.equal(facebook.getAppId(), config.appId, 'Expect the App ID to be set.');
    test.equal(facebook.getApiSecret(), config.secret, 'Expect the API secret to be set.');
    test.equal(facebook.getApplicationAccessToken(), config.appId + '|' + config.secret);
    test.done();
  },

  constructorWithFileUpload: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      fileUpload: true
    });
    test.equal(facebook.getAppId(), config.appId, 'Expect the App ID to be set.');
    test.equal(facebook.getApiSecret(), config.secret, 'Expect the API secret to be set.');
    test.ok(facebook.useFileUploadSupport(), 'Expect file upload support to be on.');
    test.done();
  },

  setAppId: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });
    facebook.setAppId('dummy');
    test.equal(facebook.getAppId(), 'dummy', 'Expect the App ID to be dummy.');
    test.done();
  },

  setApiSecret: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });
    facebook.setApiSecret('dummy');
    test.equal(facebook.getApiSecret(), 'dummy', 'Expect the API secret to be dummy.');
    test.done();
  },

  setAccessToken: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.setAccessToken('saltydog');
    facebook.getAccessToken(function(err, accessToken) {
      test.equal(err, null);
      test.equal(accessToken, 'saltydog',
                        'Expect installed access token to remain \'saltydog\'');
      test.done();
    });
  },

  setFileUploadSupport: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });
    test.equal(facebook.useFileUploadSupport(), false, 'Expect file upload support to be off.');
    facebook.setFileUploadSupport(true);
    test.ok(facebook.useFileUploadSupport(), 'Expect file upload support to be on.');
    test.done();
  },

  getCurrentUrl: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php?one=one&two=two&three=three'
      }
    });

    var currentUrl = facebook.getCurrentUrl();
    test.equal('http://www.test.com/unit-tests.php?one=one&two=two&three=three',
                  currentUrl, 'getCurrentUrl function is changing the current URL');

    facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php?one=&two=&three='
      }
    });

    currentUrl = facebook.getCurrentUrl();
    test.equal('http://www.test.com/unit-tests.php?one=&two=&three=',
                  currentUrl, 'getCurrentUrl function is changing the current URL');

    facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php?one&two&three'
      }
    });

    currentUrl = facebook.getCurrentUrl();
    test.equal('http://www.test.com/unit-tests.php?one&two&three',
                  currentUrl, 'getCurrentUrl function is changing the current URL');

    facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php?one&two&three&state=hoge'
      }
    });

    currentUrl = facebook.getCurrentUrl();
    test.equal('http://www.test.com/unit-tests.php?one&two&three',
                  currentUrl, 'getCurrentUrl function is changing the current URL');

    test.done();
  },

  getLoginUrl: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php'
      }
    });

    var loginUrl = url.parse(facebook.getLoginUrl(), true);
    test.equal(loginUrl.protocol, 'https:');
    test.equal(loginUrl.host, 'www.facebook.com');
    test.equal(loginUrl.pathname, '/dialog/oauth');
    test.equal(loginUrl.query.client_id, config.appId);
    test.equal(loginUrl.query.redirect_uri, 'http://www.test.com/unit-tests.php');
    test.equal(loginUrl.query.state.length, 32);
    test.done();
  },

  getLoginURLWithExtraParams: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php'
      }
    });

    var extraParams = {
      scope: 'email, sms',
      nonsense: 'nonsense'
    };
    var loginUrl = url.parse(facebook.getLoginUrl(extraParams), true);
    test.equal(loginUrl.protocol, 'https:');
    test.equal(loginUrl.host, 'www.facebook.com');
    test.equal(loginUrl.pathname, '/dialog/oauth');
    test.equal(loginUrl.query.client_id, config.appId);
    test.equal(loginUrl.query.redirect_uri, 'http://www.test.com/unit-tests.php');
    test.equal(loginUrl.query.scope, extraParams.scope);
    test.equal(loginUrl.query.nonsense, extraParams.nonsense);
    test.equal(loginUrl.query.state.length, 32);
    test.done();
  },

  getLoginURLWithScopeParamsAsArray: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'www.test.com'
        },
        url: '/unit-tests.php'
      }
    });

    var scopeParamsAsArray = ['email','sms','read_stream'];
    var extraParams = {
      scope: scopeParamsAsArray,
      nonsense: 'nonsense'
    };
    var loginUrl = url.parse(facebook.getLoginUrl(extraParams), true);
    test.equal(loginUrl.protocol, 'https:');
    test.equal(loginUrl.host, 'www.facebook.com');
    test.equal(loginUrl.pathname, '/dialog/oauth');
    test.equal(loginUrl.query.client_id, config.appId);
    test.equal(loginUrl.query.redirect_uri, 'http://www.test.com/unit-tests.php');
    test.equal(loginUrl.query.scope, scopeParamsAsArray.join(','));
    test.equal(loginUrl.query.nonsense, extraParams.nonsense);
    test.equal(loginUrl.query.state.length, 32);
    test.done();
  },

  getCodeWithValidCSRFState: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        query: {}
      }
    });

    facebook.establishCSRFTokenState();

    var code = facebook.request.query.code = 'dummy';
    facebook.request.query.state = facebook.getPersistentData('state');
    test.equal(code, facebook.getCode(), 'Expect code to be pulled from $_REQUEST[\'code\']');
    test.done();
  },

  getCodeWithInvalidCSRFState: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        query: {}
      }
    });

    facebook.establishCSRFTokenState();

    var code = facebook.request.query.code = 'dummy';
    facebook.request.query.state = facebook.getPersistentData('state') + 'forgery!!!';
    facebook.errorLog = function() {};
    test.equal(facebook.getCode(), false, 'Expect getCode to fail, CSRF state should not match.');
    test.done();
  },

  getCodeWithMissingCSRFState: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        query: {}
      }
    });

    var code = facebook.request.query.code = 'dummy';
    // intentionally don't set CSRF token at all
    facebook.errorLog = function() {};
    test.equal(facebook.getCode(), false, 'Expect getCode to fail, CSRF state not sent back.');
    test.done();
  },

  getUserFromSignedRequest: function(test) {
    var facebook = new TransientFacebook({
      appId: '117743971608120',
      secret: '943716006e74d9b9283d4d5d8ab93204',
      request: {
        body: {
          signed_request: '1sxR88U4SW9m6QnSxwCEw_CObqsllXhnpP5j2pxD97c.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEyODEwNTI4MDAsIm9hdXRoX3Rva2VuIjoiMTE3NzQzOTcxNjA4MTIwfDIuVlNUUWpub3hYVVNYd1RzcDB1U2g5d19fLjg2NDAwLjEyODEwNTI4MDAtMTY3Nzg0NjM4NXx4NURORHBtcy1nMUM0dUJHQVYzSVdRX2pYV0kuIiwidXNlcl9pZCI6IjE2Nzc4NDYzODUifQ'
        }
      }
    });

    facebook.getUser(function(err, userId) {
      test.equal(err, null);
      test.equal('1677846385', userId, 'Failed to get user ID from a valid signed request.');
      test.done();
    });
  },

  getSignedRequestFromCookie: function(test) {
    var facebook = new TransientFacebook({
      appId: '117743971608120',
      secret: '943716006e74d9b9283d4d5d8ab93204',
      request: {
        cookies: {
        }
      }
    });

    facebook.request.cookies[facebook.getSignedRequestCookieName()] = '1sxR88U4SW9m6QnSxwCEw_CObqsllXhnpP5j2pxD97c.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEyODEwNTI4MDAsIm9hdXRoX3Rva2VuIjoiMTE3NzQzOTcxNjA4MTIwfDIuVlNUUWpub3hYVVNYd1RzcDB1U2g5d19fLjg2NDAwLjEyODEwNTI4MDAtMTY3Nzg0NjM4NXx4NURORHBtcy1nMUM0dUJHQVYzSVdRX2pYV0kuIiwidXNlcl9pZCI6IjE2Nzc4NDYzODUifQ';
    test.notEqual(facebook.getSignedRequest(), null);
    facebook.getUser(function(err, userId) {
      test.equal(err, null);
      test.equal('1677846385', userId, 'Failed to get user ID from a valid signed request.');
      test.done();
    });
  },

  getSignedRequestWithIncorrectSignature: function(test) {
    var facebook = new TransientFacebook({
      appId: '117743971608120',
      secret: '943716006e74d9b9283d4d5d8ab93204',
      request: {
        cookies: {
        }
      }
    });

    facebook.request.cookies[facebook.getSignedRequestCookieName()] = '1sxR32U4SW9m6QnSxwCEw_CObqsllXhnpP5j2pxD97c.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEyODEwNTI4MDAsIm9hdXRoX3Rva2VuIjoiMTE3NzQzOTcxNjA4MTIwfDIuVlNUUWpub3hYVVNYd1RzcDB1U2g5d19fLjg2NDAwLjEyODEwNTI4MDAtMTY3Nzg0NjM4NXx4NURORHBtcy1nMUM0dUJHQVYzSVdRX2pYV0kuIiwidXNlcl9pZCI6IjE2Nzc4NDYzODUifQ';
    facebook.errorLog = function() { };
    test.equal(facebook.getSignedRequest(), null);
    facebook.getUser(function(err, userId) {
      test.equal(err, null);
      test.equal(0, userId, 'Failed to get user ID from a valid signed request.');
      test.done();
    });
  },

  nonUserAccessToken: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    // no cookies, and no request params, so no user or code,
    // so no user access token (even with cookie support)
    facebook.getAccessToken(function(err, accessToken) {
      test.equal(err, null);
      test.equal(facebook.getApplicationAccessToken(), accessToken,
                'Access token should be that for logged out users.');
      test.done();
    });
  },

  apiForLoggedOutUsers: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.api({ method: 'fql.query', query: 'SELECT name FROM user WHERE uid=4' }, function(err, response) {
      test.equal(err, null);
      test.ok(util.isArray(response));
      test.equal(response.length, 1, 'Expect one row back.');
      test.equal(response[0].name, 'Mark Zuckerberg', 'Expect the name back.');
      test.done();
    });
  },

  apiWithBogusAccessToken: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.setAccessToken('this-is-not-really-an-access-token');
    // if we don't set an access token and there's no way to
    // get one, then the FQL query below works beautifully, handing
    // over Zuck's public data.  But if you specify a bogus access
    // token as I have right here, then the FQL query should fail.
    // We could return just Zuck's public data, but that wouldn't
    // advertise the issue that the access token is at worst broken
    // and at best expired.
    facebook.api({ method: 'fql.query', query: 'SELECT name FROM profile WHERE id=4' }, function(err, response) {
      test.notEqual(null, err);
      var result = err.getResult();
      test.ok(result && typeof result === 'object', 'expect a result object');
      test.equal('190', result.error_code, 'expect code')
      test.done();
    });
  },

  apiGraphPublicData: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.api('/jerry', function(err, response) {
      test.equal(err, null);
      test.equal(response.id, '214707', 'should get expected id.');
      test.done();
    });
  },

  graphAPIWithBogusAccessToken: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.setAccessToken('this-is-not-really-an-access-token');
    facebook.api('/me', function(err, response) {
      test.equal(response, null);
      test.notEqual(err, null);
      test.equal(err + '', 'OAuthException: Invalid OAuth access token.', 'Expect the invalid OAuth token message.');
      test.done();
    });
  },

/*
  // TODO Create test user and application pattern.
  graphAPIWithExpiredAccessToken: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.setAccessToken('TODO');
    facebook.api('/me', function(err, response) {
      test.equal(response, null);
      test.notEqual(err, null);
      test.equal(err + '', 'OAuthException: Error validating access token:', 'Expect the invalid OAuth token message.');
      test.done();
    });
  },

  graphAPIMethod: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.api('/amachang', 'DELETE', function(err, response) {
      test.equal(response, null);
      test.notEqual(err, null);
      test.equal(err + '',
        'OAuthException: A user access token is required to request this resource.',
        'Expect the invalid session message.');
      test.done();
    });
  },

  graphAPIOAuthSpecError: function(test) {
    var facebook = new TransientFacebook({
      appId: config.migratedAppId,
      secret: config.migratedSecret
    });

    facebook.api('/me', { client_id: config.migratedAppId }, function(err, response) {
      test.equal(response, null);
      test.notEqual(err, null);
      test.equal(err + '',
        'invalid_request: An active access token must be used to query information about the current user.',
        'Expect the invalid session message.');
      test.done();
    });
  },

  graphAPIMethodOAuthSpecError: function(test) {
    var facebook = new TransientFacebook({
      appId: config.migratedAppId,
      secret: config.migratedSecret
    });

    facebook.api('/daaku.shah', 'DELETE', { client_id: config.migratedAppId }, function(err, response) {
      test.equal(response, null);
      test.notEqual(err, null);
      test.equal((err + '').indexOf('invalid_request'), 0);
      test.done();
    });
  },
*/

  graphAPIWithOnlyParams: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });
    facebook.api('/jerry', function(err, response) {
      test.equal(err, null);
      test.notEqual(response, null);
      test.ok(response.hasOwnProperty('id'), 'User ID should be public.');
      test.ok(response.hasOwnProperty('name'), 'User\'s name should be public.');
      test.ok(response.hasOwnProperty('first_name'), 'User\'s first name should be public.');
      test.ok(response.hasOwnProperty('last_name'), 'User\'s last name should be public.');
      test.equal(response.hasOwnProperty('work'), false,
                         'User\'s work history should only be available with ' +
                         'a valid access token.');
      test.equal(response.hasOwnProperty('education'), false,
                         'User\'s education history should only be ' +
                         'available with a valid access token.');
      test.equal(response.hasOwnProperty('verified'), false,
                         'User\'s verification status should only be ' +
                         'available with a valid access token.');
      test.done();
    });
  },

  loginURLDefaults: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples'
      }
    });
    var encodedUrl = encodeURIComponent('http://fbrell.com/examples');
    test.notEqual(facebook.getLoginUrl().indexOf(encodedUrl), -1,
                         'Expect the current url to exist.');
    test.done();
  },

  loginURLDefaultsDropStateQueryParam: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples?state=xx42xx'
      }
    });

    var expectEncodedUrl = encodeURIComponent('http://fbrell.com/examples');
    test.notEqual(facebook.getLoginUrl().indexOf(expectEncodedUrl), -1,
                      'Expect the current url to exist.');
    test.equal(facebook.getLoginUrl().indexOf('xx42xx'), -1, 'Expect the session param to be dropped.');
    test.done();
  },

  loginURLDefaultsDropCodeQueryParam: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples?code=xx42xx'
      }
    });

    var expectEncodedUrl = encodeURIComponent('http://fbrell.com/examples');
    test.notEqual(facebook.getLoginUrl().indexOf(expectEncodedUrl), -1, 'Expect the current url to exist.');
    test.equal(facebook.getLoginUrl().indexOf('xx42xx'), -1, 'Expect the session param to be dropped.');
    test.done();
  },

  loginURLDefaultsDropSignedRequestParamButNotOthers: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples?signed_request=xx42xx&do_not_drop=xx43xx'
      }
    });

    var expectEncodedUrl = encodeURIComponent('http://fbrell.com/examples');
    test.equal(facebook.getLoginUrl().indexOf('xx42xx'), -1, 'Expect the session param to be dropped.');
    test.notEqual(facebook.getLoginUrl().indexOf('xx43xx'), -1, 'Expect the do_not_drop param to exist.');
    test.done();
  },

  testLoginURLCustomNext: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples'
      }
    });

    var next = 'http://fbrell.com/custom';
    var loginUrl = facebook.getLoginUrl({
      redirect_uri: next,
      cancel_url: next
    });

    var currentEncodedUrl = encodeURIComponent('http://fbrell.com/examples');
    var expectedEncodedUrl = encodeURIComponent(next);
    test.notEqual(loginUrl.indexOf(expectedEncodedUrl), -1);
    test.equal(loginUrl.indexOf(currentEncodedUrl), -1);
    test.done();
  },

  logoutURLDefaults: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples'
      }
    });

    var encodedUrl = encodeURIComponent('http://fbrell.com/examples');
    facebook.getLogoutUrl(function(err, url) {
      test.equal(err, null);
      test.notEqual(url.indexOf(encodedUrl), -1, 'Expect the current url to exist.');
      test.done();
    });
  },

  loginStatusURLDefaults: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples'
      }
    });

    var encodedUrl = encodeURIComponent('http://fbrell.com/examples');
    test.notEqual(facebook.getLoginStatusUrl().indexOf(encodedUrl), -1,
                         'Expect the current url to exist.');
    test.done();
  },

  loginStatusURLCustom: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples'
      }
    });

    var encodedUrl1 = encodeURIComponent('http://fbrell.com/examples');
    var okUrl = 'http://fbrell.com/here1';
    var encodedUrl2 = encodeURIComponent(okUrl);
    var loginStatusUrl = facebook.getLoginStatusUrl({
      ok_session: okUrl
    });
    test.notEqual(loginStatusUrl.indexOf(encodedUrl1), -1, 'Expect the current url to exist.');
    test.notEqual(loginStatusUrl.indexOf(encodedUrl2), -1, 'Expect the current url to exist.');
    test.done();
  },

  nonDefaultPort: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
        },
        headers: {
          host: 'fbrell.com:8080'
        },
        url: '/examples'
      }
    });

    var encodedUrl = encodeURIComponent('http://fbrell.com:8080/examples');
    test.notEqual(facebook.getLoginUrl().indexOf(encodedUrl), -1, 'Expect the current url to exist.');
    test.done();
  },

  secureCurrentUrl: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
          pair: {}
        },
        headers: {
          host: 'fbrell.com'
        },
        url: '/examples'
      }
    });
    var encodedUrl = encodeURIComponent('https://fbrell.com/examples');
    test.notEqual(facebook.getLoginUrl().indexOf(encodedUrl), -1, 'Expect the current url to exist.');
    test.done();
  },

  secureCurrentUrlWithNonDefaultPort: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret,
      request: {
        connection: {
          pair: {}
        },
        headers: {
          host: 'fbrell.com:8080'
        },
        url: '/examples'
      }
    });
    var encodedUrl = encodeURIComponent('https://fbrell.com:8080/examples');
    test.notEqual(facebook.getLoginUrl().indexOf(encodedUrl), -1, 'Expect the current url to exist.');
    test.done();
  },

/*
  appSecretCall: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    var properExceptionThrown = false;
    var self = this;
    facebook.api('/' + config.appId + '/insights', function(err, response) {
      test.notEqual(err, null);
      test.equal(response, null);
      test.notEqual(err.message.indexOf('Requires session when calling from a desktop app'), -1,
                        'Incorrect exception type thrown when trying to gain ' +
                        'insights for desktop app without a user access token.');
      test.done();
    });
  },
*/

  base64UrlEncode: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });
    var input = 'Facebook rocks';
    var output = 'RmFjZWJvb2sgcm9ja3M';

    test.equal(facebook.base64UrlDecode(output).toString('utf-8'), input);
    test.done();
  },

  signedToken: function(test) {
    var facebook = new TransientFacebook({
      appId: '117743971608120',
      secret: '943716006e74d9b9283d4d5d8ab93204'
    });
    var payload = facebook.parseSignedRequest('1sxR88U4SW9m6QnSxwCEw_CObqsllXhnpP5j2pxD97c.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEyODEwNTI4MDAsIm9hdXRoX3Rva2VuIjoiMTE3NzQzOTcxNjA4MTIwfDIuVlNUUWpub3hYVVNYd1RzcDB1U2g5d19fLjg2NDAwLjEyODEwNTI4MDAtMTY3Nzg0NjM4NXx4NURORHBtcy1nMUM0dUJHQVYzSVdRX2pYV0kuIiwidXNlcl9pZCI6IjE2Nzc4NDYzODUifQ');
    test.notEqual(payload, null, 'Expected token to parse');
    test.equal(facebook.getSignedRequest(), null);

    facebook.request = {
      body: {
        signed_request: '1sxR88U4SW9m6QnSxwCEw_CObqsllXhnpP5j2pxD97c.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEyODEwNTI4MDAsIm9hdXRoX3Rva2VuIjoiMTE3NzQzOTcxNjA4MTIwfDIuVlNUUWpub3hYVVNYd1RzcDB1U2g5d19fLjg2NDAwLjEyODEwNTI4MDAtMTY3Nzg0NjM4NXx4NURORHBtcy1nMUM0dUJHQVYzSVdRX2pYV0kuIiwidXNlcl9pZCI6IjE2Nzc4NDYzODUifQ'
      }
    };
    test.deepEqual(facebook.getSignedRequest(), payload);
    test.done();
  },

  nonTossedSignedToken: function(test) {
    var facebook = new TransientFacebook({
      appId: '117743971608120',
      secret: '943716006e74d9b9283d4d5d8ab93204'
    });
    var payload = facebook.parseSignedRequest('c0Ih6vYvauDwncv0n0pndr0hP0mvZaJPQDPt6Z43O0k.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiJ9');
    test.notEqual(payload, null, 'Expected token to parse');
    test.equal(facebook.getSignedRequest(), null);

    facebook.request = {
      body: {
        signed_request: 'c0Ih6vYvauDwncv0n0pndr0hP0mvZaJPQDPt6Z43O0k.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiJ9'
      }
    };
    test.deepEqual(facebook.getSignedRequest(), { algorithm: 'HMAC-SHA256' });
    test.done();
  },

/*
  public function testBundledCACert() {
    $facebook = new TransientFacebook(array(
      'appId'  => self::APP_ID,
      'secret' => self::SECRET
    ));

      // use the bundled cert from the start
    Facebook::$CURL_OPTS[CURLOPT_CAINFO] =
      dirname(__FILE__) . '/../src/fb_ca_chain_bundle.crt';
    $response = $facebook->api('/naitik');

    unset(Facebook::$CURL_OPTS[CURLOPT_CAINFO]);
    $this->assertEquals(
      $response['id'], '5526183', 'should get expected id.');
  }
*/

  videoUpload: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    var host = null;
    facebook.makeRequest = function(_host, path, params, callback) {
      host = _host;
      callback(null, null);
    };
    facebook.api({ method: 'video.upload' }, function(err, response) {
      test.equal(host, 'api-video.facebook.com', 'video.upload should go against api-video');
      test.done();
    });
  },

  getUserAndAccessTokenFromSession: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.setPersistentData('access_token', 'foobar');
    facebook.setPersistentData('user_id', '12345');
    facebook.getAccessToken(function(err, accessToken) {
      test.equal('foobar', accessToken, 'Get access token from persistent store.');
      facebook.getUser(function(err, user) {
        test.equal('12345', user, 'Get user id from persistent store.');
        test.done();
      });
    });
  },

  getUserAndAccessTokenFromSignedRequestNotSession: function(test) {
    var facebook = new TransientFacebook({
      appId: '117743971608120',
      secret: '943716006e74d9b9283d4d5d8ab93204',
      request: {
        query: {
          signed_request: '1sxR88U4SW9m6QnSxwCEw_CObqsllXhnpP5j2pxD97c.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEyODEwNTI4MDAsIm9hdXRoX3Rva2VuIjoiMTE3NzQzOTcxNjA4MTIwfDIuVlNUUWpub3hYVVNYd1RzcDB1U2g5d19fLjg2NDAwLjEyODEwNTI4MDAtMTY3Nzg0NjM4NXx4NURORHBtcy1nMUM0dUJHQVYzSVdRX2pYV0kuIiwidXNlcl9pZCI6IjE2Nzc4NDYzODUifQ'
        }
      }
    });

    facebook.setPersistentData('user_id', '41572');
    facebook.setPersistentData('access_token', 'dummy');
    facebook.getUser(function(err, user) {
      test.equal(err, null);
      test.notEqual('41572', user, 'Got user from session instead of signed request.');
      test.equal('1677846385', user, 'Failed to get correct user ID from signed request.');
      facebook.getAccessToken(function(err, accessToken) {
        test.equal(err, null);
        test.notEqual(accessToken, 'dummy', 
          'Got access token from session instead of signed request.');
        test.notEqual(accessToken.length, 0,
          'Failed to extract an access token from the signed request.');
        test.done();
      });
    });
  },

  getUserWithoutCodeOrSignedRequestOrSession: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.getUser(function(err, user) {
      test.equal(user, 0);
      test.done();
    });
  },

  makeRequest: function(test) {
    var facebook = new TransientFacebook({
      appId: config.appId,
      secret: config.secret
    });

    facebook.makeRequest('graph.facebook.com', '/amachang', { method: 'GET' }, function(err, data) {
      test.equal(err, null);
      test.notEqual(data, null);
      test.equal(JSON.parse(data).id, '1055572299');
      test.done();
    });
  }

});

function TransientFacebook() {
  this.store = {};
  BaseFacebook.apply(this, arguments);
};

util.inherits(TransientFacebook, BaseFacebook);

TransientFacebook.prototype.setPersistentData = function(key, value) {
  this.store[key] = value;
};

TransientFacebook.prototype.getPersistentData = function(key, defaultValue) {
  return this.store[key] || defaultValue;
};

TransientFacebook.prototype.clearPersistentData = function(key) {
  delete this.store[key];
};

TransientFacebook.prototype.clearAllPersistentData = function() {
  this.store = {};
};

