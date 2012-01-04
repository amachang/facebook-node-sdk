
var assert = require('assert');
var path = require('path');
var fs = require('fs');

function Multipart() {
  this.dash = new Buffer('--', 'ascii');

  this.boundary = this.generateBoundary();

  this.parts = [];
}

Multipart.prototype.dash = null;
Multipart.prototype.boundary = null;
Multipart.prototype.crlf = new Buffer('\r\n', 'ascii');

Multipart.prototype.generateBoundary = function() {
  return new Buffer(
    Math.floor(Math.random() * 0x80000000).toString(36) +
    Math.abs(Math.floor(Math.random() * 0x80000000) ^ +new Date()).toString(36),
    'ascii'
  );
};

Multipart.prototype.addFile = function(name, filePath, callback) {
  var self = this;
  fs.open(filePath, 'r', function(err, fd) {
    if (err) {
      callback && callback(err);
      callback = null;
      return;
    }
    fs.fstat(fd, function(err, stat) {
      if (err) {
        callback && callback(err);
        callback = null;
        return;
      }
      var fileName = path.basename(filePath);
      self.addStream(name, stat.size, fs.createReadStream(filePath, { fd: fd }), null, fileName);
      callback && callback(null);
      callback = null;
    });
  });
};

Multipart.prototype.addBuffer = function(name, buffer, mime, fileName) {
  this.parts.push({
    type: 'buffer',
    name: new Buffer(name, 'utf8'),
    fileName: typeof fileName === 'string' ? new Buffer(fileName, 'utf8') : null,
    buffer: buffer,
    size: buffer.length,
    mime: new Buffer(mime || 'application/octet-stream', 'ascii')
  });
};

Multipart.prototype.addStream = function(name, size, stream, mime, fileName) {
  stream.pause();
  this.parts.push({
    type: 'stream',
    name: new Buffer(name, 'utf8'),
    fileName: typeof fileName === 'string' ? new Buffer(fileName, 'utf8') : null,
    stream: stream,
    size: size,
    mime: new Buffer(mime || 'application/octet-stream', 'ascii')
  });
};

Multipart.prototype.addText = function(name, text) {
  var buffer = new Buffer(text, 'ascii');
  this.addBuffer(name, buffer, 'text/plain; charset=UTF-8');
};

Multipart.prototype.contentTypeValuePrefix = new Buffer('multipart/form-data; boundary=', 'ascii');

Multipart.prototype.getContentType = function() {
  var buffer = new Buffer(this.contentTypeValuePrefix.length + this.boundary.length);
  this.contentTypeValuePrefix.copy(buffer);
  this.boundary.copy(buffer, this.contentTypeValuePrefix.length);
  return buffer;
};

Multipart.prototype.contentDispositionPrefix = new Buffer('Content-Disposition: form-data; name="', 'ascii');
Multipart.prototype.contentDispositionSuffix = new Buffer('"', 'ascii');
Multipart.prototype.contentDispositionFilenamePrefix = new Buffer('; filename="', 'ascii');
Multipart.prototype.contentDispositionFilenameSuffix = new Buffer('"', 'ascii');
Multipart.prototype.partContentTypePrefix = new Buffer('Content-Type: ', 'ascii');

Multipart.prototype.getContentLength = function() {

  var self = this;
  var length = this.parts.reduce(function(sum, part) {
    var partLength = self.dash.length +
                     self.boundary.length +
                     self.crlf.length;

    partLength += self.contentDispositionPrefix.length +
                  part.name.length +
                  self.contentDispositionSuffix.length;
    if (part.fileName !== null) {
      partLength += self.contentDispositionFilenamePrefix.length +
                    part.fileName.length +
                    self.contentDispositionFilenamePrefix.length;
    }
    partLength += self.crlf.length;

    partLength += self.partContentTypePrefix.length +
                  part.mime.length +
                  self.crlf.length +
                  self.crlf.length;

    partLength += part.size + self.crlf.length;

    return partLength;
  }, 0);

  length += self.dash.length +
            self.boundary.length +
            self.dash.length +
            self.crlf.length;

  return length;
};

Multipart.prototype.writeToStream = function(stream, callback) {
  var self = this;
  var parts = this.parts;

  stream.once('error', function(err) {
    stream.destroy();
    callback && callback(err);
    callback = null;
  });

  loop();

  function loop() {
    var part = parts.shift();
    if (part === undefined) {
      last();
      return;
    }

    stream.write(self.dash);
    stream.write(self.boundary);
    stream.write(self.crlf);

    stream.write(self.contentDispositionPrefix);
    stream.write(part.name);
    stream.write(self.contentDispositionSuffix);
    if (part.fileName !== null) {
      stream.write(self.contentDispositionFilenamePrefix);
      stream.write(part.fileName);
      stream.write(self.contentDispositionFilenameSuffix);
    }
    stream.write(self.crlf);

    stream.write(self.partContentTypePrefix);
    stream.write(part.mime);
    stream.write(self.crlf);
    stream.write(self.crlf);

    if (part.type === 'buffer') {
      stream.write(part.buffer);
      stream.write(self.crlf);
      loop();
    }
    else {
      assert.equal(part.type, 'stream');
      part.stream.once('error', function(err) {
        part.stream.destroy();
        try { stream.destroy() } catch (e) { }
        callback && callback(err);
        callback = null;
      });
      part.stream.once('end', function() {
        stream.write(self.crlf);
        loop();
      });
      part.stream.pipe(stream, { end: false });
      part.stream.resume();
    }
  }

  function last() {
    stream.write(self.dash);
    stream.write(self.boundary);
    stream.write(self.dash);
    stream.once('end', function() {
      callback && callback();
      callback = null;
    });
    stream.write(self.crlf);
  }
};

module.exports = Multipart;

