import request, {Response} from "request";
import FridaClient from "./fridaClient";
import FileFetcher from "../utils/fileFetcher";
import {exec} from "../utils/process";
import Adb from "../android/adb";
import Logger from "../logger/logger";

export default class FridaServer {
    private readonly fileFetcher: FileFetcher;
    private readonly adb: Adb;
    private readonly client: FridaClient;

    constructor(fileFetcher: FileFetcher, adb: Adb) {
        this.fileFetcher = fileFetcher;
        this.adb = adb;
        this.client = new FridaClient();
    }

    public async resolveVersion(version: string): Promise<string> {
        if (version) {
            if (version === "auto") {
                return this.client.getLocalVersion();
            } else if (version === "latest") {
                return this.getLatestServerRelease();
            }
            return version;
        }
        return this.getLatestServerRelease();
    }

    public getLatestServerRelease(): Promise<string> {
        return new Promise((resolve, reject) => {
            Logger.debug("Resolving latest Frida server version");

            request("https://api.github.com/repos/frida/frida/releases/latest", {
                headers: {
                    "user-agent": "CLI",
                },
            }, (error, response: Response, body) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode === 200) {
                    const content = JSON.parse(body);
                    resolve(content["tag_name"]);
                }
            });
        });
    }

    public retrieveRelease(version: string, cpuAbi: string) {
        Logger.debug(`Retrieving Frida server ${version} for ${cpuAbi}`);

        cpuAbi = this.filterCpuAbi(cpuAbi);

        return this.fileFetcher.getOrFetch(`frida/${version}/${cpuAbi}/frida-server`, () => {
            return this.downloadAndExtractRelease(version, cpuAbi);
        });
    }

    private downloadAndExtractRelease(version: string, cpuAbi: string): Promise<string> {
        const url = `https://github.com/frida/frida/releases/download/${version}/frida-server-${version}-android-${cpuAbi}.xz`;

        return this.fileFetcher.getOrFetch(`frida/${version}/${cpuAbi}/frida-server.xz`, (fullPath) => this.fileFetcher.downloadFile(url, fullPath))
            .then(xzPath => exec("xz", "-d", xzPath)
                .then(() => xzPath.replace(/\.zx$/i, ""))
            );
    }

    public install(localPath: string, remotePath: string): Promise<string> {
        Logger.debug(`Installing Frida server to ${remotePath}`);

        return this.adb.root()
            .then(() => this.adb.pushFile(localPath, remotePath, 755));
    }

    public start(remotePath: string): Promise<string> {
        Logger.debug(`Starting Frida server from ${remotePath}`);

        return this.adb.root()
            .then(() => this.adb.shell(remotePath));
    }

    public retrievePid(): Promise<number> {
        return this.adb.shell("ps -A | grep frida-server")
            .then(result => result.split(/\s+/)[1])
            .catch(() => null);
    }

    private filterCpuAbi(cbuAbi: string): string {
        if (cbuAbi.startsWith("arm64")) {
            return "arm64";
        }
        return cbuAbi;
    }

}
