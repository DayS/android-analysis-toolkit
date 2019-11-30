import Certificate from "./certificate";
import {exec} from "../utils/process";
import FileFetcher from "../utils/fileFetcher";
import os from "os";
import Logger from "../logger/logger";

export default class CharlesCertificate extends Certificate {

    private readonly fileFetcher: FileFetcher;

    public constructor(fileFetcher: FileFetcher) {
        super();
        this.fileFetcher = fileFetcher;
    }

    public extractCertificate() {
        const osType = os.type().toLowerCase();

        let binary: string;
        if (osType === "darwin") {
            binary = "/Applications/Charles.app/Contents/MacOS/Charles";
        } else if (osType === "linux") {
            binary = "Charles";
        } else {
            throw new Error(`${osType} not supported for automatic certificate extraction from Charles`);
        }

        Logger.debug("Extracting Charles's SSL certificate");

        return this.fileFetcher.getOrFetch("charles.pem", () => {
            return exec(binary, "ssl", "export", this.fileFetcher.fullPath("charles.pem"));
        });
    }

}
