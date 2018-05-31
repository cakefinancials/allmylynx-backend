/**
 * Helper file to configure rollbar for our package
 */
export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
    const NestedError = container[BOTTLE_NAMES.EXTERN_NESTED_ERROR];
    const R = container[BOTTLE_NAMES.EXTERN_RAMDA];
    const Rollbar = container[BOTTLE_NAMES.EXTERN_ROLLBAR];

    const ROLLBAR_ACCESS_TOKEN = envLib.getEnvVar("ROLLBAR_ACCESS_TOKEN");
    const stage = envLib.getEnvVar("MY_STAGE");

    const rollbar = new Rollbar({
        accessToken: ROLLBAR_ACCESS_TOKEN,
        captureUncaught: true,
        captureUnhandledRejections: true,
        enabled: stage !== "test",
        environment: stage,
        reportLevel: "warning", // same as default for now
        verbose: true,
    });

    const createWrappedError = (errorName, message, nestedError) => {
        class WrappedError extends NestedError {
            constructor(msg, nested) {
                super(msg, nested);
            }
        }

        WrappedError.prototype.name = errorName;
        return new WrappedError(message, nestedError);
    };

    return {
        getContextualLogger: (name) => {
            const rollbarFns = [
                "log",
                "debug",
                "info",
                "warning",
                "error",
                "critical",
            ];

            const contextualRollbar = { createWrappedError };

            R.forEach((fnName) => {
                contextualRollbar[fnName] = (...options) => {
                    const isStr = (opt) => typeof opt === 'string' || opt instanceof String;

                    const strOptions = R.filter(isStr, options);
                    const nonStrOptions = R.reject(isStr, options);

                    const message = R.head(strOptions);

                    const contextualMessage = R.isNil(message) ? name : [name, message].join(': ');

                    rollbar[fnName](contextualMessage, ...options);

                    console.log({level: fnName, message: contextualMessage, nonStrOptions});
                };
            }, rollbarFns);

            contextualRollbar.createAndLogWrappedError = (errorName, message, nestedError, context) => {
                const wrappedError = createWrappedError(errorName, message, nestedError);

                contextualRollbar.error(wrappedError, context);

                return wrappedError;
            };

            return contextualRollbar;
        },

        rollbar
    };
}
