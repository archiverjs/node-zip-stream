import { createReadStream, createWriteStream } from "fs";
import { assert } from "chai";
import { mkdirp } from "mkdirp";
import { Readable } from "readable-stream";
import { binaryBuffer, fileBuffer } from "./helpers/index.js";
import Packer from "../index.js";

var testBuffer = binaryBuffer(1024 * 16);
var testDate = new Date("Jan 03 2013 14:26:38 GMT");
var testDate2 = new Date("Feb 10 2013 10:24:42 GMT");
var testDateOverflow = new Date("Jan 1 2044 00:00:00 GMT");
var testDateUnderflow = new Date("Dec 30 1979 23:59:58 GMT");

describe("pack", function () {
  before(function () {
    mkdirp.sync("tmp");
  });
  describe("#entry", function () {
    it("should append Buffer sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/buffer.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(testBuffer, { name: "buffer.txt", date: testDate });
      archive.finalize();
    });
    it("should append Stream sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/stream.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(createReadStream("test/fixtures/test.txt"), {
        name: "stream.txt",
        date: testDate,
      });
      archive.finalize();
    });
    it("should append Stream-like sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/stream-like.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(Readable.from(["test"]), {
        name: "stream-like.txt",
        date: testDate,
      });
      archive.finalize();
    });
    it("should append multiple sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/multiple.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(
        "string",
        { name: "string.txt", date: testDate },
        function (err) {
          if (err) throw err;
          archive.entry(
            testBuffer,
            { name: "buffer.txt", date: testDate2 },
            function (err) {
              if (err) throw err;
              archive.entry(
                createReadStream("test/fixtures/test.txt"),
                { name: "stream.txt", date: testDate2 },
                function (err) {
                  if (err) throw err;
                  archive.entry(
                    createReadStream("test/fixtures/test.txt"),
                    { name: "stream-store.txt", date: testDate, store: true },
                    function (err) {
                      if (err) throw err;
                      archive.finalize();
                    },
                  );
                },
              );
            },
          );
        },
      );
    });
    it("should support STORE for Buffer sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/buffer-store.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(testBuffer, {
        name: "buffer.txt",
        date: testDate,
        store: true,
      });
      archive.finalize();
    });
    it("should support STORE for Stream sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/stream-store.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(createReadStream("test/fixtures/test.txt"), {
        name: "stream.txt",
        date: testDate,
        store: true,
      });
      archive.finalize();
    });
    it("should support archive and file comments", function (done) {
      var archive = new Packer({
        comment: "this is a zip comment",
        forceUTC: true,
      });
      var testStream = createWriteStream("tmp/comments.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(testBuffer, {
        name: "buffer.txt",
        date: testDate,
        comment: "this is a file comment",
      });
      archive.finalize();
    });
    it("should STORE files when compression level is zero", function (done) {
      var archive = new Packer({
        forceUTC: true,
        level: 0,
      });
      var testStream = createWriteStream("tmp/store-level0.zip");
      testStream.on("close", function () {
        //assert.equal(testStream.digest, '70b50994c971dbb0e457781cf6d23ca82e5ccbc0');
        done();
      });
      archive.pipe(testStream);
      archive.entry(testBuffer, { name: "buffer.txt", date: testDate });
      archive.finalize();
    });
    it("should properly handle utf8 encoded characters in file names and comments", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/accentedchars-filenames.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(
        testBuffer,
        {
          name: "àáâãäçèéêëìíîïñòóôõöùúûüýÿ.txt",
          date: testDate,
          comment: "àáâãäçèéêëìíîïñòóôõöùúûüýÿ",
        },
        function (err) {
          if (err) throw err;
          archive.entry(
            testBuffer,
            {
              name: "ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ.txt",
              date: testDate2,
              comment: "ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ",
            },
            function (err) {
              if (err) throw err;
              archive.finalize();
            },
          );
        },
      );
    });
    it("should append zero length sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/zerolength.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry("", { name: "string.txt", date: testDate }, function (err) {
        if (err) throw err;
        archive.entry(
          Buffer.alloc(0),
          { name: "buffer.txt", date: testDate },
          function (err) {
            if (err) throw err;
            archive.entry(
              createReadStream("test/fixtures/empty.txt"),
              { name: "stream.txt", date: testDate },
              function (err) {
                if (err) throw err;
                archive.finalize();
              },
            );
          },
        );
      });
    });
    it("should support setting file mode (permissions)", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/filemode.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(testBuffer, {
        name: "buffer.txt",
        date: testDate,
        mode: 420, // 0644
      });
      archive.finalize();
    });
    it("should support creating an empty zip", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/empty.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.finalize();
    });
    it("should support compressing images for Buffer sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/buffer-image.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(fileBuffer("test/fixtures/image.png"), {
        name: "image.png",
        date: testDate,
      });
      archive.finalize();
    });
    it("should support compressing images for Stream sources", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/stream-image.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(createReadStream("test/fixtures/image.png"), {
        name: "image.png",
        date: testDate,
      });
      archive.finalize();
    });
    it("should prevent UInt32 under/overflow of dates", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/date-boundaries.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(
        testBuffer,
        { name: "date-underflow.txt", date: testDateUnderflow },
        function (err) {
          if (err) throw err;
          archive.entry(
            testBuffer,
            { name: "date-overflow.txt", date: testDateOverflow },
            function (err) {
              if (err) throw err;
              archive.finalize();
            },
          );
        },
      );
    });
    it("should handle data that exceeds its internal buffer size", function (done) {
      var archive = new Packer({
        highWaterMark: 1024 * 4,
        forceUTC: true,
      });
      var testStream = createWriteStream("tmp/buffer-overflow.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(
        binaryBuffer(1024 * 512),
        { name: "buffer-overflow.txt", date: testDate },
        function (err) {
          if (err) throw err;
          archive.entry(
            binaryBuffer(1024 * 1024),
            { name: "buffer-overflow-store.txt", date: testDate, store: true },
            function (err) {
              if (err) throw err;
              archive.finalize();
            },
          );
        },
      );
    });
    it("should support directory entries", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/type-directory.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(null, { name: "directory/", date: testDate });
      archive.finalize();
    });
    it("should support symlink entries", function (done) {
      var archive = new Packer();
      var testStream = createWriteStream("tmp/type-symlink.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(
        "some text",
        { name: "file", date: testDate },
        function (err) {
          if (err) throw err;
          archive.entry(
            null,
            {
              type: "symlink",
              name: "file-link",
              linkname: "file",
              date: testDate,
            },
            function (err) {
              if (err) throw err;
              archive.entry(
                null,
                {
                  type: "symlink",
                  name: "file-link-2",
                  linkname: "file",
                  date: testDate,
                  mode: 420, // 0644
                },
                function (err) {
                  if (err) throw err;
                  archive.finalize();
                },
              );
            },
          );
        },
      );
    });
    it("should support appending forward slash to entry names", function (done) {
      var archive = new Packer({
        namePrependSlash: true,
      });
      var testStream = createWriteStream("tmp/name-prepend-slash.zip");
      testStream.on("close", function () {
        done();
      });
      archive.pipe(testStream);
      archive.entry(
        "some text",
        { name: "file", namePrependSlash: false, date: testDate },
        function (err) {
          if (err) throw err;
          archive.entry(
            "more text",
            { type: "file", name: "file-with-prefix", date: testDate },
            function (err) {
              if (err) throw err;
              archive.finalize();
            },
          );
        },
      );
    });
  });
});
