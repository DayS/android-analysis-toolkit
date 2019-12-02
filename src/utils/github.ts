import Logger from "../logger/logger";
import request, {Response} from "request";

export default class Github {
    static retrieveLatestReleaseVersion(repoOwner: string, repoName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            Logger.debug("Resolving latest release version for %s/%s", repoOwner, repoName);

            request(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`, {
                headers: {
                    "user-agent": "CLI",
                },
            }, (error, response: Response, body) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode === 200) {
                    const content = JSON.parse(body);
                    resolve(content["tag_name"]);
                }
            });
        });
    }
}
