import exec from "../utils/process";

export default class FridaClient {

    public getLocalVersion(): Promise<string> {
        return exec('frida', '--version')
    }

}
