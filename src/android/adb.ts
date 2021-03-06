import {exec} from "../utils/process";

export default class Adb {

    private readonly deviceId: string | null;
    private readonly adbPath: string = "adb";

    constructor(device: string | null, adbPath: string = "adb") {
        this.deviceId = device;
        this.adbPath = adbPath;
    }

    public execOnDevice(command: string, ...args: string[]): Promise<string> {
        const processArgs: string[] = [];
        if (this.deviceId !== null) {
            processArgs.push("-s", this.deviceId);
        }
        processArgs.push(command);
        processArgs.push(...args);

        return exec(this.adbPath, ...processArgs);
    }

    public shell(command: string, ...args: string[]): Promise<string> {
        return this.execOnDevice("shell", command, ...args);
    }

    public pullFile(remotePath: string, localPath: string): Promise<string> {
        return this.execOnDevice("pull", remotePath, localPath);
    }

    public pushFile(localPath: string, remotePath: string, chmod: number | null = null): Promise<string> {
        const pushPromise = this.execOnDevice("push", localPath, remotePath);

        if (chmod) {
            return pushPromise.then(() => this.shell("chmod", chmod.toString(), remotePath));
        }
        return pushPromise;
    }

    public getCpuAbi(): Promise<string> {
        return this.shell("getprop", "ro.product.cpu.abi");
    }

    public getAndroidVersion(): Promise<string> {
        return this.shell("getprop", "ro.build.version.release")
            .then((version: string) => version.length < 2 ? version + ".0" : version);
    }

    public root(): Promise<string> {
        return this.execOnDevice("root");
    }

    public remount(): Promise<string> {
        return this.execOnDevice("remount");
    }

    public reboot(): Promise<string> {
        return this.execOnDevice("reboot");
    }

}
