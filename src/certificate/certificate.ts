import exec from "../utils/process";

export default class Certificate {

    public computeHash(path: string): Promise<string> {
        return exec('openssl', 'x509', '-inform', 'PEM', '-subject_hash_old', '-in', path)
            .then(result => result.split(/\n/)[0])
    }

}
