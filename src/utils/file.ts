import fs from "fs";
import {join, parse} from "path";

export default class File {
    public static findFiles(lookupFolder: string, filePattern: { [Symbol.match](string: string): RegExpMatchArray | null } = null): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(lookupFolder, (err, files: string[]) => {
                if (err) {
                    reject(err);
                } else {
                    const fullFiles = files.map(file => join(lookupFolder, file));

                    if (filePattern) {
                        resolve(fullFiles.filter((file: string) => file.match(filePattern)));
                    } else {
                        resolve(fullFiles);
                    }
                }
            });
        });
    }

    public static removeExt(path: string): string {
        const parsedPath = parse(path);
        return join(parsedPath.dir, parsedPath.name);
    }

}
