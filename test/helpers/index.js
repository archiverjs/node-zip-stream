'use strict';

const crypto = require('crypto');
const fs = require('fs');
const inherits = require('util').inherits;

const Stream = require('stream').Stream;
const Readable = require('readable-stream').Readable;
const Writable = require('readable-stream').Writable;

function adjustDateByOffset(d, offset) {
  d = (d instanceof Date) ? d : new Date();

  if (offset >= 1) {
    d.setMinutes(d.getMinutes() - offset);
  } else {
    d.setMinutes(d.getMinutes() + Math.abs(offset));
  }

  return d;
}

module.exports.adjustDateByOffset = adjustDateByOffset;

function binaryBuffer(n) {
  const buffer = Buffer.alloc(n);

  for (let i = 0; i < n; i++) {
    buffer.writeUInt8(i & 255, i);
  }

  return buffer;
}

module.exports.binaryBuffer = binaryBuffer;

function BinaryStream(size, options) {
  Readable.call(this, options);

  const buf = Buffer.alloc(size);

  for (let i = 0; i < size; i++) {
    buf.writeUInt8(i & 255, i);
  }

  this.push(buf);
  this.push(null);
}

inherits(BinaryStream, Readable);

BinaryStream.prototype._read = function(size) {};

module.exports.BinaryStream = BinaryStream;

function DeadEndStream(options) {
  Writable.call(this, options);
}

inherits(DeadEndStream, Writable);

DeadEndStream.prototype._write = function(chuck, encoding, callback) {
  callback();
};

module.exports.DeadEndStream = DeadEndStream;

function fileBuffer(filepath) {
  return fs.readFileSync(filepath);
}

module.exports.fileBuffer = fileBuffer;

function UnBufferedStream() {
  this.readable = true;
}

inherits(UnBufferedStream, Stream);

module.exports.UnBufferedStream = UnBufferedStream;

function WriteHashStream(path, options) {
  fs.WriteStream.call(this, path, options);

  this.hash = crypto.createHash('sha1');
  this.digest = null;

  this.on('close', function() {
    this.digest = this.hash.digest('hex');
  });
}

inherits(WriteHashStream, fs.WriteStream);

WriteHashStream.prototype.write = function(chunk) {
  if (chunk) {
    this.hash.update(chunk);
  }

  return fs.WriteStream.prototype.write.call(this, chunk);
};

module.exports.WriteHashStream = WriteHashStream;
