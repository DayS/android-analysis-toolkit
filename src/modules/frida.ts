import Module from "./module";
import {Command} from "commander";
import FileFetcher from "../utils/fileFetcher";
import Adb from "../adb/adb";
import FridaServer from "../frida/fridaServer";

export default class FridaModule implements Module {

    private readonly fileFetcher: FileFetcher;
    private readonly defaultRemoteFridaPath: string;

    public constructor(fileFetcher: FileFetcher, defaultRemoteFridaPath: string = '/data/local/tmp/frida-server') {
        this.fileFetcher = fileFetcher;
        this.defaultRemoteFridaPath = defaultRemoteFridaPath;
    }

    public static prepare(fileFetcher: FileFetcher): FridaModule {
        return new FridaModule(fileFetcher)
    }

    public apply(commander: Command): void {
        commander
            .command('frida-install')
            .description('Install an instance of Frida server on the device')
            .option('-d, --device <serial>', 'Device serial id')
            .option('-p, --frida-path <path>', 'Path where Frida server will be installed', this.defaultRemoteFridaPath)
            .option('-v, --frida-version <version>', 'Frida server\'s version. "auto" for resolving with local frida instance, "latest" or empty for downloading latest, or a specific version', 'auto')
            .action((options: FridaInstallParams) => {
                console.info('Installing Frida server');

                let adb = new Adb(options.device);
                let fridaServer = new FridaServer(this.fileFetcher, adb);

                adb.getCpuAbi()
                    .then((cpuAbi) => fridaServer.resolveVersion(options.fridaVersion)
                        .then((fridaVersion) => fridaServer.retrieveRelease(fridaVersion, cpuAbi))
                        .then((localFridaPath) => fridaServer.install(localFridaPath, options.fridaPath))
                        .catch(reason => console.error(`Failed to install Frida server : ${reason}`)))
                    .catch(reason => console.error(`Failed to resolve device CPU : ${reason}`))
            });

        commander
            .command('frida-start')
            .description('Start the instance of Frida server installed on the device')
            .option('-d, --device <serial>', 'Device serial id')
            .option('-p, --frida-path <path>', 'Path where Frida server has been be installed', this.defaultRemoteFridaPath)
            .action((options: FridaStartParams) => {
                console.info('Starting Frida server');

                let adb = new Adb(options.device);
                let fridaServer = new FridaServer(this.fileFetcher, adb);

                fridaServer.start(options.fridaPath)
                    .then(() => console.info('Frida server started'))
                    .catch(reason => console.error(`Failed to start Frida server : ${reason}`))
            });

        commander
            .command('frida-pid')
            .description('Retrieve the running instance\'s PID of Frida server on device')
            .action((options: FridaPidParams) => {
                let adb = new Adb(options.device);
                let fridaServer = new FridaServer(this.fileFetcher, adb);

                fridaServer.retrievePid()
                    .then(pid => console.info(pid))
                    .catch(reason => console.error(`Failed to start Fridra server : ${reason}`))
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
