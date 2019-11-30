import {describe, it} from "mocha";
import chai, {assert, expect} from "chai";
import {exec} from "../../src/utils/process";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Process Test", () => {
    it("should raise the process error", () => {
        expect(exec("unknowncommand")).to.be.rejectedWith(Error);
    });
    it("should raise error if stderr is not null", () => {
        expect(exec("ls", "<malformed>")).to.be.rejectedWith(Error);
    });

    it("should return stdout", async () => {
        assert.equal(await exec("date", "-r", "60", "+%Y%m%d"), "19700101");
    });
});
