import * as path from "path";
import * as fs from "fs";
import {homedir} from "os";

export default class FileFetcher {
    private readonly basePath: string;

    constructor(basePath = path.join(homedir(), '.cache')) {
        this.basePath = basePath
    }

    /**
     * Return full path for the given relative one
     * @param relativePath
     */
    public fullPath(relativePath: string | null): string {
        if (!relativePath) throw new Error(`Path requires a relative path.`);

        return path.join(this.basePath, relativePath)
    }

    /**
     * Return full path for the given relative one. If the file didn't exists, call `fetchPromiseFactory()` first
     * @param relativePath
     * @param fetchPromiseFactory
     */
    public async getOrFetch(relativePath: string, fetchPromiseFactory: (fullPath: string) => Promise<string>): Promise<string> {
        const cachedFile = this.fullPath(relativePath);
        const cachedFileFolder = path.dirname(cachedFile);

        console.debug(`Looking for local cached file ${cachedFile}`);

        try {
            fs.accessSync(cachedFile, fs.constants.F_OK);
            return cachedFile;
        } catch (err) {
            fs.mkdirSync(cachedFileFolder, {recursive: true})
        }

        return fetchPromiseFactory(cachedFile);
    }

}
