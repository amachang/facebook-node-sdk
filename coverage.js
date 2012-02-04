var spawn = require('child_process').spawn;

var rm = spawn('rm', ['-rf', 'lib-cov']);
rm.on('exit', function(code) {
  if (code !== 0) {
    console.error('Failure: rm -rf lib-cov');
    return;
  }
  var jscov = spawn('./node_modules/.bin/node-jscoverage', ['lib', 'lib-cov']);
  jscov.on('exit', function(code) {
    if (code !== 0) {
      console.error('Failure: jscoverage');
      return;
    }
    var expresso = spawn('./node_modules/.bin/expresso');
    expresso.stdout.pipe(process.stdout);
    expresso.stderr.pipe(process.stderr);
    expresso.on('exit', function(code) {
      var rm = spawn('rm', ['-rf', 'lib-cov']).on('exit', function() {
        if (code !== 0) {
          consnole.log('Failure: expresso');
        }
      });
    });
  });
});
