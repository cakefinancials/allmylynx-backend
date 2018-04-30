/**
 * Place all of our dependencies in a bottle
 */
import Bottle from "bottlejs";
import R from "ramda";

/* all of the node module dependencies */
import AWS from "aws-sdk";
import Promise from "bluebird";
// for some reason, openpgp.key will be undefined unless we use require syntax
const openpgp = require('openpgp');

/* all of the local dependencies */
import { BOTTLE_FACTORY as awsLibBottleFactory } from "./aws";
import { BOTTLE_FACTORY as helperLibBottleFactory } from "./helper";
import { BOTTLE_FACTORY as pgpLibBottleFactory } from "./pgp";
import { BOTTLE_FACTORY as responseLibBottleFactory } from "./response";

export const BOTTLE_NAMES = {
    EXTERN_AWS_SDK: "node_modules|aws-sdk",
    EXTERN_BLUEBIRD: "node_modules|bluebird",
    EXTERN_OPENPGP: "node_modules|openpgp",

    LIB_AWS: "lib|aws",
    LIB_HELPER: "lib|helper",
    LIB_PGP: "lib|pgp",
    LIB_RESPONSE: "lib|response",
};

export function buildBottle(overrides = {}) {
    const bottle = new Bottle();

    const factories = R.merge({
        [BOTTLE_NAMES.EXTERN_AWS_SDK]: () => AWS,
        [BOTTLE_NAMES.EXTERN_BLUEBIRD]: () => Promise,
        [BOTTLE_NAMES.EXTERN_OPENPGP]: () => openpgp,
        [BOTTLE_NAMES.LIB_AWS]: awsLibBottleFactory,
        [BOTTLE_NAMES.LIB_HELPER]: helperLibBottleFactory,
        [BOTTLE_NAMES.LIB_PGP]: pgpLibBottleFactory,
        [BOTTLE_NAMES.LIB_RESPONSE]: responseLibBottleFactory,
    }, overrides);

    R.forEachObjIndexed((factory, name) => bottle.factory(name, factory), factories);

    return bottle;
}

export function wrapLambdaFunction(lambdaFn) {
    return (event, content, callback) => {
        const bottle = buildBottle();
        return lambdaFn(event, content, bottle.container, callback);
    };
};
