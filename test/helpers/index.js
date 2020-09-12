const crypto = require('crypto');
const fs = require('fs');

const { Stream } = require('stream');
const { Readable, Writable } = require('readable-stream');

function adjustDateByOffset(d, offset) {
  d = d instanceof Date ? d : new Date();

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

class BinaryStream extends Readable {
  constructor(options) {
    super(options);
    const buf = Buffer.alloc(size);

    for (let i = 0; i < size; i++) {
      buf.writeUInt8(i & 255, i);
    }

    this.push(buf);
    this.push(null);
  }
  _read(size) {}
}

module.exports.BinaryStream = BinaryStream;

class DeadEndStream extends Writable {
  constructor(options) {
    super(options);
  }
  _write(chuck, encoding, callback) {
    callback();
  }
}

module.exports.DeadEndStream = DeadEndStream;

function fileBuffer(filepath) {
  return fs.readFileSync(filepath);
}

module.exports.fileBuffer = fileBuffer;

class UnBufferedStream extends Stream {
  constructor() {
    super();
    this.readable = true;
  }
}

module.exports.UnBufferedStream = UnBufferedStream;

class WriteHashStream extends fs.WriteStream {
  constructor(path, options) {
    super(path, options);
    this.hash = crypto.createHash('sha1');
    this.digest = null;

    this.on('close', function () {
      this.digest = this.hash.digest('hex');
    });
  }
  write(chunk) {
    if (chunk) {
      this.hash.update(chunk);
    }

    return fs.WriteStream.prototype.write.call(this, chunk);
  }
}

module.exports.WriteHashStream = WriteHashStream;
