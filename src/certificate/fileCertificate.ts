import Certificate from "./certificate";

export default class FileCertificate extends Certificate {
    private readonly path: string;

    public constructor(path: string) {
        super();
        this.path = path;
    }

    async extractCertificate(): Promise<string> {
        return this.path;
    }

}
