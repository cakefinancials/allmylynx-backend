/**
 * Place all of our dependencies in a bottle
 */
import Bottle from "bottlejs";

/* all of the node module dependencies */
import AWS from "aws-sdk";
import Promise from "bluebird";
import R from "ramda";
import Rollbar from "rollbar";
// for some reason, openpgp.key will be undefined unless we use require syntax
const openpgp = require('openpgp');

/* all of the local dependencies */
import { BOTTLE_FACTORY as helperLibBottleFactory } from "./helper";
import { BOTTLE_FACTORY as responseLibBottleFactory } from "./response";
import { BOTTLE_FACTORY as loggerLibBottleFactory } from "./logger";

import { BOTTLE_FACTORY as awsLibBottleFactory } from "../clients/aws";
import { BOTTLE_FACTORY as envLibBottleFactory } from "../clients/env";
import { BOTTLE_FACTORY as pgpLibBottleFactory } from "../clients/pgp";

export const BOTTLE_NAMES = {
    EXTERN_AWS_SDK: "node_modules|aws-sdk",
    EXTERN_BLUEBIRD: "node_modules|bluebird",
    EXTERN_OPENPGP: "node_modules|openpgp",
    EXTERN_RAMDA: "node_modules|ramda",
    EXTERN_ROLLBAR: "node_modules|rollbar",

    LIB_HELPER: "lib|helper",
    LIB_RESPONSE: "lib|response",
    LIB_LOGGER: "lib|logger",

    CLIENT_AWS: "client|aws",
    CLIENT_ENV: "client|env",
    CLIENT_PGP: "client|pgp",
};

export const testBottleBuilderFactory = (defaultMocks = {}) => (overrides = {}) => {
    const bottle = buildBottle(
        R.pipe(
            R.mergeDeepRight(defaultMocks),
            R.mapObjIndexed(value => () => value)
        )(overrides)
    );

    const { success, failure } = bottle.container[BOTTLE_NAMES.LIB_RESPONSE];

    return {
        bottle,
        success,
        failure
    };
};


let DEFAULT_BOTTLE_OVERRIDES = {};

export const setDefaultBottleOverrides = (overrides) => {
    DEFAULT_BOTTLE_OVERRIDES = R.merge(DEFAULT_BOTTLE_OVERRIDES, overrides);
}

function buildBottle(overrides = {}) {
    const bottle = new Bottle();

    const factories = R.mergeAll([{
        BOTTLE_NAMES: () => BOTTLE_NAMES,
        [BOTTLE_NAMES.EXTERN_AWS_SDK]: () => AWS,
        [BOTTLE_NAMES.EXTERN_BLUEBIRD]: () => Promise,
        [BOTTLE_NAMES.EXTERN_OPENPGP]: () => openpgp,
        [BOTTLE_NAMES.EXTERN_RAMDA]: () => R,
        [BOTTLE_NAMES.EXTERN_ROLLBAR]: () => Rollbar,

        [BOTTLE_NAMES.CLIENT_AWS]: awsLibBottleFactory,
        [BOTTLE_NAMES.CLIENT_ENV]: envLibBottleFactory,
        [BOTTLE_NAMES.LIB_HELPER]: helperLibBottleFactory,
        [BOTTLE_NAMES.CLIENT_PGP]: pgpLibBottleFactory,
        [BOTTLE_NAMES.LIB_RESPONSE]: responseLibBottleFactory,
        [BOTTLE_NAMES.LIB_LOGGER]: loggerLibBottleFactory,
    }, DEFAULT_BOTTLE_OVERRIDES, overrides]);

    R.forEachObjIndexed((factory, name) => bottle.factory(name, factory), factories);

    return bottle;
}

export function wrapLambdaFunction(lambdaFn) {
    const bottle = buildBottle();
    const {rollbar} = bottle.container[BOTTLE_NAMES.LIB_LOGGER];

    return rollbar.lambdaHandler((event, content, callback) => {
        return lambdaFn(event, content, bottle.container, callback);
    });
};
