import Module from "./module";
import {Command} from "commander";
import Adb from "../android/adb";
import CharlesCertificate from "../certificate/charlesCertificate";
import FileFetcher from "../utils/fileFetcher";
import Certificate from "../certificate/certificate";
import FileCertificate from "../certificate/fileCertificate";
import Logger from "../logger/logger";

export default class MitmModule implements Module {
    private readonly fileFetcher: FileFetcher;

    constructor(fileFetcher: FileFetcher) {
        this.fileFetcher = fileFetcher;
    }

    public static prepare(fileFetcher: FileFetcher): MitmModule {
        return new MitmModule(fileFetcher);
    }

    apply(commander: Command): void {
        commander
            .command("mitm-install-cert <source>")
            .description("Install a PEM certificate as a system certificate on the device from a given <source> (Can be: file, charles)")
            .option("-d, --device <serial>", "Device serial id", null)
            .option("-p, --path <path>", "Path to PEM certificate in case of 'file' source")
            .action((source: SourceType, options: MitmInstallCertParams) => {
                let certificate: Certificate;
                if (source === "charles") {
                    certificate = new CharlesCertificate(this.fileFetcher);
                } else if (source === "file") {
                    certificate = new FileCertificate(options.path);
                } else {
                    Logger.error("Source must be one of : file, charles");
                    return;
                }

                console.info("Installing certificate as system");

                const adb = new Adb(options.device);

                certificate.extractCertificate()
                    .then(path => certificate.computeHash(path)
                        .catch(reason => console.error(`Unable to compute certificate hash : ${reason}`))
                        .then(hash => {
                                Logger.debug("Installing certificate %s with hash %s", path, hash);

                                return adb.root()
                                    .then(() => adb.shell("mount -o rw,remount /system"))
                                    .then(() => adb.pushFile(path, `/system/etc/security/cacerts/${hash}.0`, 644))
                                    .then(() => adb.reboot());
                            }
                        )
                    )
                    .catch(reason => console.error(`Unable to install certificate : ${reason}`));
            });
    }

}

type SourceType = "file" | "charles";

class MitmInstallCertParams {
    public device: string | null;
    public source: SourceType;
    public path: string;
}
