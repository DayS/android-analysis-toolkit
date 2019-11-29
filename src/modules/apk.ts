import Module from "./module";
import {Command} from "commander";
import Adb from "../adb/adb";
import Logger from "../logger/logger";

export default class ApkModule implements Module {

    public static prepare(): ApkModule {
        return new ApkModule();
    }

    public apply(commander: Command): void {
        commander
            .command("apk-pull <package_name> [local_file]")
            .option("-d, --device <serial>", "Device serial id", null)
            .option("-e, --exact", "Indicate if the <package_name> should be an exact match")
            .description("Find and pull APK from the device by using his identifier")
            .action((packageName: string, localFile: string | null, options: ApkPullParams) => {
                Logger.info(`Searching APK with id ${packageName}`);

                const adb = new Adb(options.device);

                adb.shell("pm list packages -f")
                    .then(output => output.split("\n").filter(line => line.indexOf(packageName) !== -1))
                    .then(output => options.exact ? output.filter(line => line.match(new RegExp(`^package:(.+\.apk)=${packageName}$`, "i"))) : output)
                    .then(output => {
                        if (output.length > 1) {
                            throw Error(`Too many results (${output.length}) :\n${output.join("\n")}`);
                        }

                        const regexp = /^package:(.+\.apk)=(.+)$/i;
                        const matches = regexp.exec(output[0]);
                        if (matches) {
                            return [matches[2], matches[1]];
                        }

                        throw Error("Unable to parse output");
                    })
                    .then(([apkId, apkPath]) => adb.pullFile(apkPath, localFile || `${apkId}.apk`))
                    .catch(reason => Logger.error(`Unable to pul: APK : ${reason}`));
            });
    }

}

class ApkPullParams {
    public device: string | null;
    public exact: boolean;
}
