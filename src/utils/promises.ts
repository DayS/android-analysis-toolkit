export default class Promises {

    /**
     * Call an array of promises sequentially
     *
     * Forked from https://decembersoft.com/posts/promises-in-serial-with-array-reduce/
     * @param promises
     */
    public static chain<T>(promises: Promise<T>[]): Promise<T[]> {
        return promises.reduce((chain, promise) => {
            return chain.then(chainResults =>
                promise.then(currentResult =>
                    [...chainResults, currentResult]
                )
            );
        }, Promise.resolve([]));
    }

}
