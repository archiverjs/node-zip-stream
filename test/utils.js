import { assert } from "chai";
import { dateify, sanitizePath } from "../utils.js";

const testDateString = "Jan 03 2013 14:26:38 GMT";
const testDate = new Date(testDateString);
const testDateEpoch = 1357223198;
const testDateOctal = 12071312436;

describe("utils", function () {
  describe("dateify(dateish)", function () {
    it("should return an instance of Date", function () {
      assert.instanceOf(dateify(testDate), Date);
      assert.instanceOf(dateify(testDateString), Date);
      assert.instanceOf(dateify(null), Date);
    });

    it("should passthrough an instance of Date", function () {
      assert.deepEqual(dateify(testDate), testDate);
    });

    it("should convert dateish string to an instance of Date", function () {
      assert.deepEqual(dateify(testDateString), testDate);
    });
  });

  describe("sanitizePath(filepath)", function () {
    it("should sanitize filepath", function () {
      assert.equal(sanitizePath("\\this/path//file.txt"), "this/path/file.txt");
      assert.equal(sanitizePath("/this/path/file.txt"), "this/path/file.txt");
      assert.equal(
        sanitizePath("./this\\path\\file.txt"),
        "./this/path/file.txt",
      );
      assert.equal(
        sanitizePath("../this\\path\\file.txt"),
        "this/path/file.txt",
      );

      assert.equal(
        sanitizePath("c:\\this\\path\\file.txt"),
        "this/path/file.txt",
      );
      assert.equal(sanitizePath("\\\\server\\share\\"), "server/share/");
    });
  });
});
