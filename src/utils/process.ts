'use strict';

import {spawn} from "child_process";

export default function exec(command: string, ...args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child_process = spawn(command, args);

        let outBuffer = '';
        let errBuffer = '';
        let error: Error = null;

        child_process.stdout.on('data', (data) => outBuffer += data + '\n');
        child_process.stderr.on('data', (data) => errBuffer += data + '\n');

        child_process.on('error', (err) => error = err);
        child_process.on('close', (code) => {
            if (error != null) {
                reject(error);
            } else {
                if (code === 0) {
                    resolve(outBuffer.trim())
                } else {
                    reject(new Error(errBuffer.trim()))
                }
            }
        })
    })
}
