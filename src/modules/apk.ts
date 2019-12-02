import Module from "./module";
import {Command} from "commander";
import Adb from "../android/adb";
import Logger from "../logger/logger";
import {ApktoolFactory} from "../android/apktool";
import FileFetcher from "../utils/fileFetcher";
import {JadxFactory} from "../android/jadx";

export default class ApkModule implements Module {
    private fileFetcher: FileFetcher;

    constructor(fileFetcher: FileFetcher) {
        this.fileFetcher = fileFetcher;
    }

    public static prepare(fileFetcher: FileFetcher): ApkModule {
        return new ApkModule(fileFetcher);
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
                    .then(([apkId, apkPath]) => {
                        const localPath = localFile || `${apkId}.apk`;
                        Logger.info("Found APK %s. Pulling to %s", apkId, localPath);

                        return adb.pullFile(apkPath, localPath);
                    })
                    .catch(reason => Logger.error(`Unable to pull APK : ${reason}`));
            });

        commander
            .command("apk-decompile <apk_path>")
            .description("Decompile given APK")
            .action((apkPath: string) => {
                Logger.info(`Decompiling APK ${apkPath}`);

                const apktoolFactory = new ApktoolFactory(this.fileFetcher);
                const jadxFactory = new JadxFactory(this.fileFetcher);

                Promise.all([apktoolFactory.build("latest"), jadxFactory.build("latest")])
                    .then(([apktool, jadx]) => apktool.decompileApk(apkPath, `${apkPath}.out`)
                        .then(() => jadx.findAndDecompileDexFiles(`${apkPath}.out`))
                    )
                    .catch(reason => Logger.error(`Unable to decompile APK : ${reason}`));
            });

    }

}

class ApkPullParams {
    public device: string | null;
    public exact: boolean;
}
