import exec from "../utils/process";

export default abstract class Certificate {

    public computeHash(path: string): Promise<string> {
        return exec('openssl', 'x509', '-inform', 'PEM', '-subject_hash_old', '-in', path)
            .then(result => result.split(/\n/)[0])
    }

    public abstract extractCertificate(): Promise<string>;

}
