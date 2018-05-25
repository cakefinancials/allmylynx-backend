export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const Promise = container[BOTTLE_NAMES.EXTERN_BLUEBIRD];

    const SERVICE = {
        obfuscate: (str, charactersToShow) => {
            const lastCharacters = charactersToShow <= 0 ? "" : str.slice(-1 * charactersToShow);

            const originalStrLength = str.length;
            const firstCharacters = str.substr(0, originalStrLength - charactersToShow);
            const stars = Array(firstCharacters.length + 1).join('*');

            return [stars, lastCharacters].join('');
        },

        executeAllPromises: (promises) => {
            // Wrap all Promises in a Promise that will always "resolve"
            const resolvingPromises = promises.map(function (promise) {
                return new Promise(function (resolve) {
                    const payload = {};

                    promise.then(function (result) {
                            payload.result = result;
                        })
                        .catch(function (error) {
                            payload.error = error;
                        })
                        .then(function () {
                            /*
                            * The wrapped Promise returns an array:
                            * The first position in the array holds the result (if any)
                            * The second position in the array holds the error (if any)
                            */
                            resolve(payload);
                        });
                });
            });

            var errors = [];
            var results = [];

            // Execute all wrapped Promises
            return Promise.all(resolvingPromises)
                .then(function (items) {
                    items.forEach(function (payload) {
                        if (payload.error) {
                            errors.push(payload.error);
                        } else {
                            results.push(payload.result);
                        }
                    });

                    return {
                        errors: errors,
                        results: results
                    };
                });
        },
    };

    return SERVICE;
}
