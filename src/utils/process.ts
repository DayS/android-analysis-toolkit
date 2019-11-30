"use strict";

import {spawn} from "child_process";
import Logger from "../logger/logger";

function doExec(useShell: boolean, command: string, ...args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        Logger.debug("Execute command '%s' with args %s", command, args);

        const childProcess = spawn(command, args, {shell: useShell});

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
                    reject(new Error(errBuffer.trim() || outBuffer.trim()));
                }
            }
        });
    });
}

/**
 * Use this method instead of {@link exec} to allow wildcard resolution in arguments
 * @param command
 * @param args
 */
export function execShell(command: string, ...args: string[]): Promise<string> {
    return doExec(false, command, ...args);
}

export function exec(command: string, ...args: string[]): Promise<string> {
    return doExec(true, command, ...args);
}
