import exec from "../utils/process";

export default class FridaClient {

    public getLocalVersion(): Promise<string> {
        console.debug("Resolving local Frida server version");

        return exec("frida", "--version");
    }

}
