var util = require('util');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var reporter = require('nodeunit').reporters.default;

fs.readdir(path.join(__dirname, 'unit'), function (err, files) {
  if (err) {
    util.debug(err);
    process.exit(-1)
  }
  else {
    assert.ok(files instanceof Array, 'Files must be an array.');
    files = files.filter(function(file) {
      return file.match(/\.js$/);
    });
    files = files.map(function(file) {
      return path.join('tests', 'unit', file);
    });
    assert.ok(files.length > 0, 'There are no test files.');
    reporter.run(files);
  }
});
