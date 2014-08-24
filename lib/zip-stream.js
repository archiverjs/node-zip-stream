/**
 * node-zip-stream
 *
 * Copyright (c) 2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-zip-stream/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;

var ZipArchiveOutputStream = require('compress-commons').ZipArchiveOutputStream;
var ZipArchiveEntry = require('compress-commons').ZipArchiveEntry;

var util = require('./util');

var ZipStream = module.exports = function(options) {
  if (!(this instanceof ZipStream)) {
    return new ZipStream(options);
  }

  ZipArchiveOutputStream.call(this, options);

  if (this.options.comment && this.options.comment.length > 0) {
    this.setComment(this.options.comment);
  }
};

inherits(ZipStream, ZipArchiveOutputStream);

ZipStream.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    type: 'file',
    name: null,
    date: null,
    mode: null,
    store: this.options.store,
    comment: ''
  });

  var isDir = data.type === 'directory';

  if (data.name) {
    data.name = util.sanitizePath(data.name);

    if (data.name.slice(-1) === '/') {
      isDir = true;
      data.type = 'directory';
    } else if (isDir) {
      data.name += '/';
    }
  }

  data.date = util.dateify(data.date);

  return data;
};

ZipStream.prototype.entry = function(source, data, callback) {
  if (typeof callback !== 'function') {
    callback = this._emitErrorCallback.bind(this);
  }

  data = this._normalizeFileData(data);

  if (data.type !== 'file' && data.type !== 'directory') {
    callback(new Error(data.type + ' entries not currently supported'));
    return;
  }

  if (typeof data.name !== 'string' || data.name.length === 0) {
    callback(new Error('entry name must be a non-empty string value'));
    return;
  }

  var entry = new ZipArchiveEntry(data.name);
  entry.setTime();

  if (entry.isDirectory()) {
    entry.setMethod(0);
  }

  if (data.comment.length > 0) {
    entry.setComment(data.comment);
  }

  if (typeof data.mode === 'number') {
    entry.setUnixMode(data.mode);
  }

  return ZipArchiveOutputStream.prototype.entry.call(this, entry, source, callback);
};

ZipStream.prototype.finalize = function() {
  this.finish();
};