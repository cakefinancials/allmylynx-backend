/**
 * Helper file to configure rollbar for our package
 */

import { BOTTLE_NAMES } from "./bottle";

export function BOTTLE_FACTORY(container) {
    const envLib = container[BOTTLE_NAMES.LIB_ENV];
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

    return {
        getContextualRollbar: (name) => {
            const rollbarFns = [
                "log",
                "debug",
                "info",
                "warning",
                "error",
                "critical",
            ];

            const contextualRollbar = {};

            R.forEach((fnName) => {
                contextualRollbar[fnName] = (message, ...options) => {
                    const contextualMessage = [name, message].join(': ');

                    rollbar[fnName](contextualMessage, ...options);
                    console.log({level: fnName, message: contextualMessage, options});
                };
            }, rollbarFns);

            return contextualRollbar;
        },

        rollbar
    };
}
