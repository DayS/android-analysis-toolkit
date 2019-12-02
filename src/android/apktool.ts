import Github from "../utils/github";
import {exec} from "../utils/process";
import FileFetcher from "../utils/fileFetcher";
import Logger from "../logger/logger";

export class Apktool {
    private readonly apkTool: string;

    public constructor(apkTool: string) {
        this.apkTool = apkTool;
    }

    public exec(command: string, ...args: string[]): Promise<string> {
        return exec("java", "-jar", this.apkTool, command, ...args);
    }

    public decompileApk(apkPath: string, outputPath: string): Promise<string> {
        return this.exec("decode", "--force", "--output", outputPath, apkPath)
            .then(() => exec("unzip", apkPath, "classes*.dex", "-d", outputPath));
    }
}

export class ApktoolFactory {
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
        return exec("apktool", "--version");
    }

    protected getLatestServerRelease(): Promise<string> {
        return Github.retrieveLatestReleaseVersion("iBotPeaches", "Apktool");
    }

    public build(version: string): Promise<Apktool> {
        Logger.debug("Retrieving Apktool %s", version);

        return this.resolveVersion(version)
            .then(resolvedVersion => {
                const cleanedVersion = resolvedVersion.replace("v", "");
                const url = `https://github.com/iBotPeaches/Apktool/releases/download/${resolvedVersion}/apktool_${cleanedVersion}.jar`;

                return this.fileFetcher.getOrFetch(`apktool/apktool-${cleanedVersion}.jar`, (fullPath) => this.fileFetcher.downloadFile(url, fullPath))
                    .then(apktoolPath => new Apktool(apktoolPath));
            });
    }

}

