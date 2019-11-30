import Module from "./module";
import {Command} from "commander";
import FileFetcher from "../utils/fileFetcher";
import Adb from "../android/adb";
import FridaServer from "../frida/fridaServer";
import Logger from "../logger/logger";

export default class FridaModule implements Module {

    private readonly fileFetcher: FileFetcher;
    private readonly defaultRemoteFridaPath: string;

    public constructor(fileFetcher: FileFetcher, defaultRemoteFridaPath: string = "/data/local/tmp/frida-server") {
        this.fileFetcher = fileFetcher;
        this.defaultRemoteFridaPath = defaultRemoteFridaPath;
    }

    public static prepare(fileFetcher: FileFetcher): FridaModule {
        return new FridaModule(fileFetcher);
    }

    public apply(commander: Command): void {
        commander
            .command("frida-install")
            .description("Install an instance of Frida server on the device")
            .option("-d, --device <serial>", "Device serial id", null)
            .option("-p, --frida-path <path>", "Path where Frida server will be installed", this.defaultRemoteFridaPath)
            .option("-v, --frida-version <version>", "Frida server's version. 'auto' for resolving with local frida instance, 'latest' or empty for downloading latest, or a specific version", "auto")
            .action((options: FridaInstallParams) => {
                Logger.info("Installing Frida server");

                const adb = new Adb(options.device);
                const fridaServer = new FridaServer(this.fileFetcher, adb);

                adb.getCpuAbi()
                    .then((cpuAbi) => fridaServer.resolveVersion(options.fridaVersion)
                        .then((fridaVersion) => fridaServer.retrieveRelease(fridaVersion, cpuAbi))
                        .then((localFridaPath) => fridaServer.install(localFridaPath, options.fridaPath))
                        .catch(reason => Logger.error(`Failed to install Frida server : ${reason}`)))
                    .catch(reason => Logger.error(`Failed to resolve device CPU : ${reason}`));
            });

        commander
            .command("frida-start")
            .description("Start the instance of Frida server installed on the device")
            .option("-d, --device <serial>", "Device serial id", null)
            .option("-p, --frida-path <path>", "Path where Frida server has been be installed", this.defaultRemoteFridaPath)
            .action((options: FridaStartParams) => {
                Logger.info(`Starting Frida server from ${options.fridaPath}`);

                const adb = new Adb(options.device);
                const fridaServer = new FridaServer(this.fileFetcher, adb);

                fridaServer.start(options.fridaPath)
                    .then(() => Logger.info("Frida server started"))
                    .catch(reason => Logger.error(`Failed to start Frida server : ${reason}`));
            });

        commander
            .command("frida-pid")
            .description("Retrieve the running instance's PID of Frida server on device")
            .option("-d, --device <serial>", "Device serial id", null)
            .action((options: FridaPidParams) => {
                const adb = new Adb(options.device);
                const fridaServer = new FridaServer(this.fileFetcher, adb);

                fridaServer.retrievePid()
                    .then(pid => console.info(pid))
                    .catch(reason => Logger.error(`Failed to start Fridra server : ${reason}`));
            });
    }

}

class FridaInstallParams {
    public device: string | null;
    public fridaPath: string | null;
    public fridaVersion: string | null;
}

class FridaStartParams {
    public device: string | null;
    public fridaPath: string | null;
}

class FridaPidParams {
    public device: string | null;
}
