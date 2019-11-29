import Module from "./module";
import {Command} from "commander";
import Adb from "../adb/adb";
import CharlesCertificate from "../certificate/charlesCertificate";
import FileFetcher from "../utils/fileFetcher";
import Certificate from "../certificate/certificate";
import FileCertificate from "../certificate/fileCertificate";

export default class MitmModule implements Module {
    private readonly fileFetcher: FileFetcher;

    constructor(fileFetcher: FileFetcher) {
        this.fileFetcher = fileFetcher;
    }

    public static prepare(fileFetcher: FileFetcher): MitmModule {
        return new MitmModule(fileFetcher)
    }

    apply(commander: Command): void {
        commander
            .command('mitm-install-cert')
            .description('Install the given PEM certificate as a system certificate on the device')
            .option('-d, --device <serial>', 'Device serial id')
            .option('-s, --source <source> [options]', 'Source of PEM certificate. Can be: file, charles')
            .option('-p, --path <path>', 'Path to PEM certificate in case of "file“ source')
            .action((options: MitmInstallCertParams) => {
                let certificate: Certificate;
                if (options.source === "charles") {
                    certificate = new CharlesCertificate(this.fileFetcher);
                } else if (options.source === "file") {
                    certificate = new FileCertificate(options.path);
                }

                console.info('Installing certificate as system');

                let adb = new Adb(options.device);

                certificate.extractCertificate()
                    .then(path => certificate.computeHash(path)
                        .catch(reason => console.error(`Unable to compute certificate hash : ${reason}`))
                        .then(hash => adb.root()
                            .then(() => adb.shell('mount -o rw,remount /system'))
                            .then(() => adb.pushFile(path, `/system/etc/security/cacerts/${hash}.0`, 644))
                            .then(() => adb.reboot())))
                    .catch(reason => console.error(`Unable to install certificate : ${reason}`))
            });
    }

}

type SourceType = "file" | "charles";

class MitmInstallCertParams {
    public device: string | null;
    public source: SourceType;
    public path: string;
}
