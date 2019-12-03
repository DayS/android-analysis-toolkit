import {exec} from "../utils/process";
import FileFetcher from "../utils/fileFetcher";
import File from "../utils/file";
import {join} from "path";

export default class AndroidSdk {
    private fileFetcher: FileFetcher;
    private androidHome: string;

    constructor(fileFetcher: FileFetcher, androidHome: string) {
        this.fileFetcher = fileFetcher;
        this.androidHome = androidHome;
    }

    protected resolveLatestBuildTool(): Promise<string> {
        return File.findFiles(join(this.androidHome, "build-tools"))
            .then(buildTools => {
                if (buildTools.length === 0) {
                    throw new Error(`No build-tools found on ${this.androidHome}`);
                }
                return buildTools[buildTools.length - 1];
            });
    }

    public generateKeystore(alias: string, password: string): Promise<string> {
        const relativePath = "sdk/resign.keystore";
        return this.fileFetcher.getOrFetch(relativePath, (fullPath) => {
            return exec("keytool", "-genkey", "-v",
                "-keystore", fullPath, "-alias", alias,
                "-keyalg", "RSA", "-keysize", "2048", "-validity", "10000",
                "-dname", "CN=Unknown, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=Unknown",
                "-storepass", password, "-keypass", password)
                .then(() => fullPath);
        });
    }

    public retrieveKeystore(path: string | null, alias: string, password: string): Promise<string> {
        if (!path || path === "auto") {
            return this.generateKeystore(alias, password);
        }
        return Promise.resolve(path);
    }

    public signApk(apkPath: string, keystorePath: string, keystoreAlias: string, keystorePassword: string): Promise<string> {
        return exec("jarsigner", "-verbose", "-sigalg", "SHA1withRSA", "-digestalg", "SHA1",
            "-keystore", keystorePath, "-storepass", keystorePassword, "-keypass", keystorePassword, apkPath, keystoreAlias);
    }

    public alignApk(apkPath: string, alignedZipPath: string): Promise<string> {
        return this.resolveLatestBuildTool()
            .then(buildTool => exec(join(buildTool, "zipalign"), "-f", "-v", "4", apkPath, alignedZipPath));
    }

}
