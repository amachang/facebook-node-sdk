
var path = require('path');
var fs = require('fs');

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

var Multipart = require(path.join(libdir, 'multipart.js'));

module.exports = {

  constructor: function(beforeExit, assert) {
    var done = false;
    beforeExit(function() { assert.ok(done) });

    var multipart = new Multipart();
    assert.equal(multipart.dash.length, 2);
    assert.equal(multipart.dash.toString('ascii'), '--');
    assert.ok(multipart.boundary.length > 0);
    assert.ok(multipart.boundary.toString('ascii').match(/^[0-9a-z]+$/));

    done = true;
  },

  addFile: function(beforeExit, assert) {
    var done = false;
    beforeExit(function() { assert.ok(done) });

    var multipart = new Multipart();
    multipart.addFile('src', __filename, function(err) {
      assert.equal(err, null);
      multipart.addFile('src', __filename + '.notfound', function(err) {
        assert.notEqual(err, null);
        assert.equal(err.code, 'ENOENT');

        multipart.addFile('src', __dirname, function(err) {

          multipart.writeToStream(process.stdout, function() {
            done = true;
          });
        });
      });
    });
  }

};

