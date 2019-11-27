import FileFetcher from "../../src/utils/fileFetcher";
import {describe, it} from "mocha";
import {assert} from "chai";

let fileFetcher = new FileFetcher("/var/cache");

describe('FileFetch Test', () => {
    it('should fail if null', () => {
        assert.throws(() => fileFetcher.fullPath(null), Error);
        assert.throws(() => fileFetcher.fullPath(""), Error);
    });

    it('should generate full path', () => {
        assert.equal(fileFetcher.fullPath("test"), "/var/cache/test");
        assert.equal(fileFetcher.fullPath("/test"), "/var/cache/test");
        assert.equal(fileFetcher.fullPath("subfolder/test"), "/var/cache/subfolder/test");
        assert.equal(fileFetcher.fullPath("/more/subfolder/test"), "/var/cache/more/subfolder/test");
    });
});
