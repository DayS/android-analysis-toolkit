import FileFetcher from "../utils/fileFetcher";
import {exec, execShell} from "../utils/process";
import fs from "fs";
import request, {Response} from "request";
import Logger from "../logger/logger";

export default class Playstore {
    private fileFetcher: FileFetcher;

    constructor(fileFetcher: FileFetcher) {
        this.fileFetcher = fileFetcher;
    }

    public retrieveLatestZipUrl(cpuAbi: string, androidVersion: string) {
        return new Promise((resolve, reject) => {
            Logger.debug("Resolving last Play store ZIP URL for Android %s on %s", androidVersion, cpuAbi);

            request("https://api.opengapps.org/list", {
                headers: {
                    "user-agent": "CLI",
                },
            }, (error, response: Response, body) => {
                if (error) {
                    return reject(error);
                }

                const content: OGAppResult = JSON.parse(body);

                const dataCpu = content.archs[cpuAbi];
                if (!dataCpu) {
                    return reject(new Error(`CPU ${cpuAbi} is not supported by OpenGapps`));
                }

                const dataApi = dataCpu.apis[androidVersion];
                if (!dataApi) {
                    return reject(new Error(`Android version ${androidVersion} with CPU ${cpuAbi} is not supported by OpenGapps`));
                }

                const zipUrl = this.retrieveVariantZipUrl(dataApi.variants);
                if (!zipUrl) {
                    reject(new Error("No variant found"));
                }

                resolve(zipUrl);
            });
        });
    }

    private retrieveVariantZipUrl(variants: OGApVariant[]): string | null {
        for (const variant of variants) {
            if (variant.name === "pico") {
                return variant.zip;
            }
        }
        return null;
    }

    public downloadAndExtract(cpuAbi: string, androidVersion: string, date: string): Promise<string> {
        const relativeBasename = `playstore/playstore-${cpuAbi}-${androidVersion}-${date}`;
        const fullBasename = this.fileFetcher.fullPath(relativeBasename);

        return this.fileFetcher.getOrFetch(`${relativeBasename}.zip`, (fullPath: string) => {
            return this.retrieveLatestZipUrl(cpuAbi, androidVersion)
                .then((url: string) => this.fileFetcher.downloadFile(url, fullPath));
        })
            .then(zipPath => execShell("unzip", "-o", zipPath, "Core/*", "-d", fullBasename))
            .then(() => execShell("rm", "-f", fullBasename + "/Core/setup*"))
            .then(() => execShell("lzip", "-f", "-d", fullBasename + "/Core/*.lz"))
            .then(() => new Promise((resolve, reject) => {
                    fs.readdir(fullBasename + "/Core", (err, files: string[]) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(files.filter((file: string) => file.match(/.*\.tar$/i)));
                        }
                    });
                })
            )
            .then((files: string[]) => Promise.all(files.map((file: string) => exec("tar", "-x", "--strip-components", "2", "-f", fullBasename + "/Core/" + file, "-C", fullBasename))))
            .then(() => fullBasename);
    }

}

class OGAppResult {
    public archs: { [cpu: string]: OGAppArch };
}

class OGAppArch {
    public apis: { [version: string]: OGApApi };
}

class OGApApi {
    public variants: OGApVariant[];
}

class OGApVariant {
    public name: string;
    public zip: string;
}
