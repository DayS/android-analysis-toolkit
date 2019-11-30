import Module from "./module";
import {Command} from "commander";
import Adb from "../android/adb";
import Logger from "../logger/logger";
import FileFetcher from "../utils/fileFetcher";
import Playstore from "../android/playstore";
import moment from "moment";

export default class DeviceModule implements Module {
    private fileFetcher: FileFetcher;
    private playstore: Playstore;

    constructor(fileFetcher: FileFetcher) {
        this.fileFetcher = fileFetcher;
        this.playstore = new Playstore(fileFetcher);
    }

    public static prepare(fileFetcher: FileFetcher): DeviceModule {
        return new DeviceModule(fileFetcher);
    }

    public apply(commander: Command): void {
        commander
            .command("device-install-play-store")
            .description("Download and install play store binaries on a device (Useful on emulators)")
            .option("-d, --device <serial>", "Device serial id", null)
            .action((options: DeviceInstallPlayStore) => {
                Logger.info("Installing play store");

                const adb = new Adb(options.device);

                Promise.all([adb.getCpuAbi(), adb.getAndroidVersion()])
                    .then(([cpuAbi, version]) => this.playstore.downloadAndExtract(cpuAbi, version, moment().format("YYYYMMDD")))
                    .then((folder: string) => {
                        return adb.root()
                            .then(() => adb.remount())
                            .then(() => adb.pushFile(`${folder}/etc`, "/system"))
                            .then(() => adb.pushFile(`${folder}/framework`, "/system"))
                            .then(() => adb.pushFile(`${folder}/app`, "/system"))
                            .then(() => adb.pushFile(`${folder}/priv-app`, "/system"));
                    })
                    .then(() => adb.reboot())
                    .catch(reason => Logger.error(`Unable to install playstore on device : ${reason}`));
            });
    }

}

class DeviceInstallPlayStore {
    public device: string | null;
}
