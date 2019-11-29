"use strict";

import {spawn} from "child_process";

export default function exec(command: string, ...args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, args);

        let outBuffer = "";
        let errBuffer = "";
        let error: Error = null;

        childProcess.stdout.on("data", (data) => outBuffer += data + "\n");
        childProcess.stderr.on("data", (data) => errBuffer += data + "\n");

        childProcess.on("error", (err) => error = err);
        childProcess.on("close", (code) => {
            if (error != null) {
                reject(error);
            } else {
                if (code === 0) {
                    resolve(outBuffer.trim());
                } else {
                    reject(new Error(errBuffer.trim()));
                }
            }
        });
    });
}
