import Github from "../utils/github";
import {exec} from "../utils/process";
import FileFetcher from "../utils/fileFetcher";
import Logger from "../logger/logger";
import File from "../utils/file";
import Promises from "../utils/Promises";

export class Jadx {
    private readonly jadx: string;

    public constructor(jadx: string) {
        this.jadx = jadx;
    }

    public exec(command: string, ...args: string[]): Promise<string> {
        return exec(this.jadx, command, ...args);
    }

    public findAndDecompileDexFiles(lookupFolder: string): Promise<string> {
        return File.findFiles(lookupFolder, /.dex$/i)
            .then(dexFiles => dexFiles.map(dexFile => this.decompileDex(dexFile, lookupFolder)))
            .then(decompilePromises => Promises.chain(decompilePromises))
            .then(() => lookupFolder);
    }

    public decompileDex(dexPath: string, outputPath: string): Promise<string> {
        return this.exec("--output-dir", outputPath, "--no-res", "--show-bad-code", "--export-gradle", dexPath);
    }
}

export class JadxFactory {
    private readonly fileFetcher: FileFetcher;

    constructor(fileFetcher: FileFetcher) {
        this.fileFetcher = fileFetcher;
    }

    protected async resolveVersion(version: string): Promise<string> {
        if (version) {
            if (version === "auto") {
                return this.getLocalVersion();
            } else if (version === "latest") {
                return this.getLatestServerRelease();
            }
            return version;
        }
        return this.getLatestServerRelease();
    }

    protected getLocalVersion(): Promise<string> {
        return exec("jadx", "--version");
    }

    protected getLatestServerRelease(): Promise<string> {
        return Github.retrieveLatestReleaseVersion("skylot", "jadx");
    }

    protected downloadAndExtractRelease(version: string): Promise<string> {
        const cleanedVersion = version.replace("v", "");
        const url = `https://github.com/skylot/jadx/releases/download/${version}/jadx-${cleanedVersion}.zip`;

        return this.fileFetcher.getOrFetch(`jadx/jadx-${version}.zip`, (fullPath) => this.fileFetcher.downloadFile(url, fullPath))
            .then(zipPath => exec("unzip", "-q", zipPath, "-d", File.removeExt(zipPath))
                .then(() => File.removeExt(zipPath) + "/bin/jadx")
            );
    }

    public build(version: string): Promise<Jadx> {
        Logger.debug("Retrieving Jadx %s", version);

        return this.resolveVersion(version)
            .then(resolvedVersion => this.fileFetcher.getOrFetch(`jadx/jadx-${resolvedVersion}/bin/jadx`, () => this.downloadAndExtractRelease(resolvedVersion)))
            .then(jadxPath => new Jadx(jadxPath));
    }

}

