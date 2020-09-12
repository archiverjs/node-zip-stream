/*global before,describe,it */
const fs = require('fs');

const assert = require('chai').assert;
const mkdir = require('mkdirp');

const { binaryBuffer, fileBuffer } = require('./helpers');

const Packer = require('../index.js');

const testBuffer = binaryBuffer(1024 * 16);

const testDate = new Date('Jan 03 2013 14:26:38 GMT');
const testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

const testDateOverflow = new Date('Jan 1 2044 00:00:00 GMT');
const testDateUnderflow = new Date('Dec 30 1979 23:59:58 GMT');

describe('pack', function() {
  before(function() {
    mkdir.sync('tmp');
  });

  describe('#entry', function() {

    it('should append Buffer sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/buffer.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate });
      archive.finalize();
    });

    it('should append Stream sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/stream.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate });
      archive.finalize();
    });

    it('should append multiple sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/multiple.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry('string', { name: 'string.txt', date: testDate }, function(err) {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'buffer.txt', date: testDate2 }, function(err) {
          if (err) throw err;
          archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate2 }, function(err) {
            if (err) throw err;
            archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream-store.txt', date: testDate, store: true }, function(err) {
              if (err) throw err;
              archive.finalize();
            });
          });
        });
      });
    });

    it('should support STORE for Buffer sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/buffer-store.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, store: true });
      archive.finalize();
    });

    it('should support STORE for Stream sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/stream-store.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate, store: true });
      archive.finalize();
    });

    it('should support archive and file comments', function(done) {
      const archive = new Packer({
        comment: 'this is a zip comment',
        forceUTC: true
      });

      const testStream = fs.createWriteStream('tmp/comments.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, comment: 'this is a file comment' });
      archive.finalize();
    });

    it('should STORE files when compression level is zero', function(done) {
      const archive = new Packer({
        forceUTC: true,
        level: 0
      });

      const testStream = fs.createWriteStream('tmp/store-level0.zip');

      testStream.on('close', function() {
        //assert.equal(testStream.digest, '70b50994c971dbb0e457781cf6d23ca82e5ccbc0');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate });
      archive.finalize();
    });

    it('should properly handle utf8 encoded characters in file names and comments', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/accentedchars-filenames.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ.txt', date: testDate, comment: 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ' }, function(err) {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ.txt', date: testDate2, comment: 'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ' }, function(err) {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should append zero length sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/zerolength.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry('', { name: 'string.txt', date: testDate }, function(err) {
        if (err) throw err;
        archive.entry(Buffer.alloc(0), { name: 'buffer.txt', date: testDate }, function(err) {
          if (err) throw err;
          archive.entry(fs.createReadStream('test/fixtures/empty.txt'), { name: 'stream.txt', date: testDate }, function(err) {
            if (err) throw err;
            archive.finalize();
          });
        });
      });
    });

    it('should support setting file mode (permissions)', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/filemode.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, mode: 0644 });
      archive.finalize();
    });

    it('should support creating an empty zip', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/empty.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.finalize();
    });

    it('should support compressing images for Buffer sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/buffer-image.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fileBuffer('test/fixtures/image.png'), { name: 'image.png', date: testDate });
      archive.finalize();
    });

    it('should support compressing images for Stream sources', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/stream-image.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/image.png'), { name: 'image.png', date: testDate });
      archive.finalize();
    });

    it('should prevent UInt32 under/overflow of dates', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/date-boundaries.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'date-underflow.txt', date: testDateUnderflow }, function(err) {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'date-overflow.txt', date: testDateOverflow }, function(err) {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should handle data that exceeds its internal buffer size', function(done) {
      const archive = new Packer({
        highWaterMark: 1024 * 4,
        forceUTC: true
      });

      const testStream = fs.createWriteStream('tmp/buffer-overflow.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(binaryBuffer(1024 * 512), { name: 'buffer-overflow.txt', date: testDate }, function(err) {
        if (err) throw err;
        archive.entry(binaryBuffer(1024 * 1024), { name: 'buffer-overflow-store.txt', date: testDate, store: true }, function(err) {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should support directory entries', function(done) {
      const archive = new Packer();

      const testStream = fs.createWriteStream('tmp/type-directory.zip');

      testStream.on('close', function() {
        done();
      });

      archive.pipe(testStream);

      archive.entry(null, { name: 'directory/', date: testDate });

      archive.finalize();
    });

    it('should support symlink entries', function(done) {
      const archive = new Packer();
      const testStream = fs.createWriteStream('tmp/type-symlink.zip');

        testStream.on('close', function() {
            done();
        });

        archive.pipe(testStream);

        archive.entry('some text', { name: 'file', date: testDate }, function(err) {
            if (err) throw err;
            archive.entry(null, { type: 'symlink', name: 'file-link', linkname: 'file', date: testDate }, function(err) {
                if (err) throw err;
                archive.entry(null, { type: 'symlink', name: 'file-link-2', linkname: 'file', date: testDate, mode: 0644 }, function(err) {
                    if (err) throw err;
                    archive.finalize();
                });
            });
        });
    });

  });

});
