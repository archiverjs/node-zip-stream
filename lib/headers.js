/**
 * node-zip-stream
 *
 * Copyright (c) 2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-zip-stream/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var util = require('./util');

var debug = util.debug('zip-stream:headers');

var DEFAULT_FILE_MODE = 0100664;
var DEFAULT_DIR_MODE = 040755;
var BASE_FILE_MODE = 0100000;
var BASE_DIR_MODE = 040000;

function ZipHeader() {
  this.name = 'zipHeader';
  this.bufferSize = 0;
  this.fields = [];
}

ZipHeader.prototype.toBuffer = function(data) {
  var self = this;
  var buf = new Buffer(self.bufferSize);
  var offset = 0;
  var val;
  var valLength;
  var fallback;

  debug('%s:start', self.name);

  data = self._normalize(data);

  self.fields.forEach(function(field) {
    fallback = (field.type === 'string') ? '' : 0;
    val = data[field.name] || field.def || fallback;
    valLength = (field.lenField && data[field.lenField] > 0) ? data[field.lenField] : field.len;

    var noAssert = false;

    if (field.name === 'externalFileAttributes') {
      noAssert = true;
    }

    if (typeof buf['write' + field.type] === 'function') {
      debug('%s:%s:%s:%d+%d', self.name, field.type, field.name, offset, field.len);
      buf['write' + field.type](val, offset, noAssert);
    } else if (val.length > 0) {
      debug('%s:%s:%d+%d', self.name, field.name, offset, val.length);
      buf.write(val, offset);
    }

    offset += valLength;
  });

  debug('%s:finish:%d', self.name, offset);

  return buf.slice(0, offset);
};

ZipHeader.prototype.toObject = function(buf) {
  var self = this;
  var data = {};
  var offset = 0;
  var valLength;

  self.fields.forEach(function(field) {
    valLength = (field.lenField && data[field.lenField] > 0) ? data[field.lenField] : field.len;

    if (typeof buf['read' + field.type] === 'function') {
      data[field.name] = buf['read' + field.type](offset);
    } else if (valLength > 0) {
      data[field.name] = buf.toString(null, offset, valLength);
    } else {
      data[field.name] = null;
    }

    offset += valLength;
  });

  return data;
};

ZipHeader.prototype._normalize = function(data) {
  // Don't always set mode as this is a experimental feature
  // if (!data.mode) {
  //   data.mode = DEFAULT_FILE_MODE;
  // }

  data.filenameLength = 0;
  data.commentLength = 0;
  data.extraFieldLength = 0;

  if (data.name) {
    if (Buffer.byteLength(data.name) !== data.name.length) {
      data.flags |= (1 << 11);
    }

    data.filenameLength = Buffer.byteLength(data.name);
  }

  if (data.comment) {
    if (Buffer.byteLength(data.comment) !== data.comment.length) {
      data.flags |= (1 << 11);
    }

    data.commentLength = Buffer.byteLength(data.comment);
  }

  if (data.extraField) {
    data.extraFieldLength = data.extraField.length;
  }

  if (data.mode) {
    data.mode &= ~BASE_DIR_MODE;
    data.mode |= BASE_FILE_MODE;
    data.externalFileAttributes = (data.mode << 16);
  }

  return data;
};

function ZipHeaderFile() {
  ZipHeader.call(this);

  this.name = 'file';
  this.bufferSize = 1024;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x04034b50},
    {name: 'versionNeededToExtract', len: 2, type: 'UInt16LE', def: 20},
    {name: 'flags', len: 2, type: 'UInt16LE'},
    {name: 'compressionMethod', len: 2, type: 'UInt16LE'},
    {name: 'lastModifiedDate', len: 4, type: 'UInt32LE'},
    {name: 'crc32', len: 4, type: 'Int32LE', def: 0},
    {name: 'compressedSize', len: 4, type: 'UInt32LE'},
    {name: 'uncompressedSize', len: 4, type: 'UInt32LE'},
    {name: 'filenameLength', len: 2, type: 'UInt16LE'},
    {name: 'extraFieldLength', len: 2, type: 'UInt16LE'},
    {name: 'name', len: 0, lenField: 'filenameLength', type: 'string'},
    {name: 'extraField', len: 0, lenField: 'extraFieldLength', type: 'string'}
  ];
}
inherits(ZipHeaderFile, ZipHeader);

function ZipHeaderFileDescriptor() {
  ZipHeader.call(this);

  this.name = 'fileDescriptor';
  this.bufferSize = 16;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x08074b50},
    {name: 'crc32', len: 4, type: 'Int32LE'},
    {name: 'compressedSize', len: 4, type: 'UInt32LE'},
    {name: 'uncompressedSize', len: 4, type: 'UInt32LE'}
  ];
}
inherits(ZipHeaderFileDescriptor, ZipHeader);

function ZipHeaderCentralDirectory() {
  ZipHeader.call(this);

  this.name = 'centralDirectory';
  this.bufferSize = 1024;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x02014b50},
    {name: 'versionMadeBy', len: 2, type: 'UInt16LE', def: 20},
    {name: 'versionNeededToExtract', len: 2, type: 'UInt16LE', def: 20},
    {name: 'flags', len: 2, type: 'UInt16LE'},
    {name: 'compressionMethod', len: 2, type: 'UInt16LE'},
    {name: 'lastModifiedDate', len: 4, type: 'UInt32LE'},
    {name: 'crc32', len: 4, type: 'Int32LE'},
    {name: 'compressedSize', len: 4, type: 'UInt32LE'},
    {name: 'uncompressedSize', len: 4, type: 'UInt32LE'},
    {name: 'filenameLength', len: 2, type: 'UInt16LE'},
    {name: 'extranameLength', len: 2, type: 'UInt16LE'},
    {name: 'commentLength', len: 2, type: 'UInt16LE'},
    {name: 'diskNumberStart', len: 2, type: 'UInt16LE'},
    {name: 'internalFileAttributes', len: 2, type: 'UInt16LE'},
    {name: 'externalFileAttributes', len: 4, type: 'UInt32LE'},
    {name: 'offset', len: 4, type: 'UInt32LE'},
    {name: 'name', len: 0, lenField: 'filenameLength', type: 'string'},
    {name: 'extraField', len: 0, lenField: 'extraFieldLength', type: 'string'},
    {name: 'comment', len: 0, lenField: 'commentLength', type: 'string'}
  ];
}
inherits(ZipHeaderCentralDirectory, ZipHeader);

function ZipHeaderCentralFooter() {
  ZipHeader.call(this);

  this.name = 'centralFooter';
  this.bufferSize = 512;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x06054b50},
    {name: 'diskNumber', len: 2, type: 'UInt16LE'},
    {name: 'diskNumberStart', len: 2, type: 'UInt16LE'},
    {name: 'directoryRecordsDisk', len: 2, type: 'UInt16LE'},
    {name: 'directoryRecords', len: 2, type: 'UInt16LE'},
    {name: 'centralDirectorySize', len: 4, type: 'UInt32LE'},
    {name: 'centralDirectoryOffset', len: 4, type: 'UInt32LE'},
    {name: 'commentLength', len: 2, type: 'UInt16LE'},
    {name: 'comment', len: 0, lenField: 'commentLength', type: 'string'}
  ];
}
inherits(ZipHeaderCentralFooter, ZipHeader);

var headers = {
  file: new ZipHeaderFile(),
  fileDescriptor: new ZipHeaderFileDescriptor(),
  centralDirectory: new ZipHeaderCentralDirectory(),
  centralFooter: new ZipHeaderCentralFooter()
};

var encode = exports.encode = function(type, data) {
  if (!headers[type] || typeof headers[type].toBuffer !== 'function') {
    throw new Error('Unknown encode type');
  }

  return headers[type].toBuffer(data);
};

exports.file = ZipHeaderFile;
exports.fileDescriptor = ZipHeaderFileDescriptor;
exports.centralDirectory = ZipHeaderCentralDirectory;
exports.centralFooter = ZipHeaderCentralFooter;