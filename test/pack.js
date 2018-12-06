/*global before,describe,it */
'use strict';

const fs = require('fs');

const assert = require('chai').assert;
const mkdir = require('mkdirp');

const helpers = require('./helpers');
const binaryBuffer = helpers.binaryBuffer;
const fileBuffer = helpers.fileBuffer;
const WriteHashStream = helpers.WriteHashStream;

const Packer = require('../index.js');

const testBuffer = binaryBuffer(1024 * 16);

const testDate = new Date('Jan 03 2013 14:26:38 GMT');
const testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

const testDateOverflow = new Date('Jan 1 2044 00:00:00 GMT');
const testDateUnderflow = new Date('Dec 30 1979 23:59:58 GMT');

describe('pack', () => {
  before(() => {
    mkdir.sync('tmp');
  });

  describe('#entry', () => {

    it('should append Buffer sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/buffer.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate });
      archive.finalize();
    });

    it('should append Stream sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/stream.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate });
      archive.finalize();
    });

    it('should append multiple sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/multiple.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry('string', { name: 'string.txt', date: testDate }, (err) => {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'buffer.txt', date: testDate2 }, (err) => {
          if (err) throw err;
          archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate2 }, (err) => {
            if (err) throw err;
            archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream-store.txt', date: testDate, store: true }, (err) => {
              if (err) throw err;
              archive.finalize();
            });
          });
        });
      });
    });

    it('should support STORE for Buffer sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/buffer-store.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, store: true });
      archive.finalize();
    });

    it('should support STORE for Stream sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/stream-store.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate, store: true });
      archive.finalize();
    });

    it('should support archive and file comments', (done) => {
      const archive = new Packer({
        comment: 'this is a zip comment',
        forceUTC: true
      });

      const testStream = new WriteHashStream('tmp/comments.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, comment: 'this is a file comment' });
      archive.finalize();
    });

    it('should STORE files when compression level is zero', (done) => {
      const archive = new Packer({
        forceUTC: true,
        level: 0
      });

      const testStream = new WriteHashStream('tmp/store-level0.zip');

      testStream.on('close', () => {
        assert.equal(testStream.digest, '70b50994c971dbb0e457781cf6d23ca82e5ccbc0');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate });
      archive.finalize();
    });

    it('should properly handle utf8 encoded characters in file names and comments', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/accentedchars-filenames.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ.txt', date: testDate, comment: 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ' }, (err) => {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ.txt', date: testDate2, comment: 'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ' }, (err) => {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should append zero length sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/zerolength.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry('', { name: 'string.txt', date: testDate }, (err) => {
        if (err) throw err;
        archive.entry(new Buffer(0), { name: 'buffer.txt', date: testDate }, (err) => {
          if (err) throw err;
          archive.entry(fs.createReadStream('test/fixtures/empty.txt'), { name: 'stream.txt', date: testDate }, (err) => {
            if (err) throw err;
            archive.finalize();
          });
        });
      });
    });

    it('should support setting file mode (permissions)', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/filemode.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, mode: 0o644 });
      archive.finalize();
    });

    it('should support creating an empty zip', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/empty.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.finalize();
    });

    it('should support compressing images for Buffer sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/buffer-image.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fileBuffer('test/fixtures/image.png'), { name: 'image.png', date: testDate });
      archive.finalize();
    });

    it('should support compressing images for Stream sources', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/stream-image.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/image.png'), { name: 'image.png', date: testDate });
      archive.finalize();
    });

    it('should prevent UInt32 under/overflow of dates', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/date-boundaries.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'date-underflow.txt', date: testDateUnderflow }, (err) => {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'date-overflow.txt', date: testDateOverflow }, (err) => {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should handle data that exceeds its internal buffer size', (done) => {
      const archive = new Packer({
        highWaterMark: 1024 * 4,
        forceUTC: true
      });

      const testStream = new WriteHashStream('tmp/buffer-overflow.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(binaryBuffer(1024 * 512), { name: 'buffer-overflow.txt', date: testDate }, (err) => {
        if (err) throw err;
        archive.entry(binaryBuffer(1024 * 1024), { name: 'buffer-overflow-store.txt', date: testDate, store: true }, (err) => {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should support directory entries', (done) => {
      const archive = new Packer();

      const testStream = new WriteHashStream('tmp/type-directory.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry(null, { name: 'directory/', date: testDate });

      archive.finalize();
    });

    it('should support symlink entries', (done) => {
      const archive = new Packer();
      const testStream = new WriteHashStream('tmp/type-symlink.zip');

      testStream.on('close', () => {
        done();
      });

      archive.pipe(testStream);

      archive.entry('some text', { name: 'file', date: testDate }, (err) => {
        if (err) throw err;
        archive.entry(null, { type: 'symlink', name: 'file-link', linkname: 'file', date: testDate }, (err) => {
          if (err) throw err;
          archive.entry(null, { type: 'symlink', name: 'file-link-2', linkname: 'file', date: testDate, mode: 0o644 }, (err) => {
            if (err) throw err;
            archive.finalize();
          });
        });
      });
    });

  });

});
