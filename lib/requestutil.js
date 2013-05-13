
var assert = require('assert')
    , fs = require('fs')
    , querystring = require('querystring')
    , rest = require('restler')
    , mime = require('mime');

exports.requestFacebookApi = function( host, port, path, params, method, withMultipart, callback) {
  var req = new FacebookApiRequest( host, port, path, params, method );
  req.start( withMultipart, callback );
};

// export for debug
exports.FacebookApiRequest = FacebookApiRequest;

function FacebookApiRequest( host, port, path, params, method ) {
  var url = "https://" + host + ":" + port + path;

  assert.equal(this.url, null);
  assert.equal(this.params, null);

  this.url = url;
  this.params = { data : params };
  this.method = method;

}

FacebookApiRequest.prototype.url = null;
FacebookApiRequest.prototype.method = null;
FacebookApiRequest.prototype.params = null;

FacebookApiRequest.prototype.start = function( withMultipart , callback ){

    assert.equal(this.callback, null);

    var self = this
        , keys;

    if( withMultipart ) {

      var keys = Object.keys(this.params.data)
          , hasFiles = false;

      // Iteration
      (function loop() {

        var key = keys.shift()
          , path
          , mimeType;

        if ( key === undefined ){
          self.params.multipart = hasFiles;
          self.makeRequest( callback );
          return;
        } else  if( self.params.data[ key ].charAt(0) === '@' ){
          path = self.params.data[ key ].substr(1);
          fs.open( path , 'r' , function( err , data ) {

            if( err )
              callback( err , null );
            else {

              fs.fstat(data, function( err , data) {
                if(err)
                    callback( err , null );
                else {
                  //Lookup for file mimeType
                  mimeType = mime.lookup( path );
                  //Replacing original param for restler file multipart
                  self.params.data[ key ] = rest.file( path , null , data.size , null , mimeType );
                  //Sets multipart true
                  hasFiles = true;
                  loop();
                }
              });
            }

          })

        } else
            loop()

      })();

    } else
       self.makeRequest( callback );
}

FacebookApiRequest.prototype.makeRequest = function( callback ) {
  var method = this.method === 'DELETE' ? 'del' : this.method.toLowerCase()
      , url = method === 'get' ? this.url + "?" + querystring.stringify(this.params.data) : this.url
      , params = method === 'get' ? {} : this.params;

  // Using restler to handle submition
  rest[ method ]( url, params )
      .removeAllListeners().on('complete', function( data, response ) {
          if( data.hasOwnProperty("error") ) {
              callback( data, null );
          } else {
              callback( null, data );
          }
      })

}