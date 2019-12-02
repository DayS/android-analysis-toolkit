import {describe, it} from "mocha";
import {assert} from "chai";
import File from "../../src/utils/file";

describe("File Test", () => {
    describe("#removeExt", () => {
        it("should return path without extension", () => {
            assert.equal(File.removeExt("test"), "test");
            assert.equal(File.removeExt("test.zip"), "test");

            assert.equal(File.removeExt("/var/cache/test"), "/var/cache/test");
            assert.equal(File.removeExt("/var/cache/test.zip"), "/var/cache/test");
        });
    });
});
