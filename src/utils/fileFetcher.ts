import * as path from "path";
import * as fs from "fs";
import {homedir} from "os";
import request from "request";
import Logger from "../logger/logger";

const ProgressBar = require("progress");

export default class FileFetcher {
    private readonly basePath: string;

    constructor(basePath = path.join(homedir(), ".aatk/cache")) {
        this.basePath = basePath;
    }

    /**
     * Return full path for the given relative one
     * @param relativePath
     */
    public fullPath(relativePath: string | null): string {
        if (!relativePath) throw new Error("Path requires a relative path.");

        return path.join(this.basePath, relativePath);
    }

    /**
     * Return full path for the given relative one. If the file didn't exists, call `fetchPromiseFactory()` first
     * @param relativePath
     * @param fetchPromiseFactory
     */
    public async getOrFetch(relativePath: string, fetchPromiseFactory: (fullPath: string) => Promise<string>): Promise<string> {
        const cachedFile = this.fullPath(relativePath);
        const cachedFileFolder = path.dirname(cachedFile);

        Logger.debug(`Looking for local cached file ${cachedFile}`);

        try {
            fs.accessSync(cachedFile, fs.constants.F_OK);
            return cachedFile;
        } catch (err) {
            fs.mkdirSync(cachedFileFolder, {recursive: true});
        }

        return fetchPromiseFactory(cachedFile);
    }

    public downloadFile(url: string, dest: string): Promise<string> {
        return new Promise((resolve, reject) => {
            Logger.debug(`Downloading file ${url} into ${dest}`);

            const file = fs.createWriteStream(dest);
            const sendReq = request.get(url);

            sendReq.on("response", (response) => {
                if (response.statusCode !== 200) {
                    return reject("Response status was " + response.statusCode);
                }

                const length = parseInt(response.headers["content-length"], 10);
                const bar = new ProgressBar("  downloading [:bar] :rate/bps :percent :etas", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: length
                });

                response.on("data", chunk => bar.tick(chunk.length));
                response.on("end", () => console.debug("\n"));
            });

            sendReq.on("error", (err) => {
                fs.unlink(dest, err2 => reject(err2));
                reject(err.message);
            });

            sendReq.pipe(file);

            file.on("finish", () => {
                file.close();
                resolve();
            });

            file.on("error", (err) => {
                fs.unlink(dest, err2 => reject(err2));
                reject(err.message);
            });
        });
    }

}
