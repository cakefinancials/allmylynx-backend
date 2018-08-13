/**
 * Place all of our dependencies in a bottle
 */
import Bottle from 'bottlejs';

/* all of the node module dependencies */
import AWS from 'aws-sdk';
const NestedError = require('nested-error-stacks');
import plaid from 'plaid';
import Promise from 'bluebird';
import R from 'ramda';
import Rollbar from 'rollbar';
// for some reason, openpgp.key will be undefined unless we use require syntax
const openpgp = require('openpgp');

/* all of the local dependencies */
import { BOTTLE_FACTORY as helperLibBF } from './helper';
import { BOTTLE_FACTORY as responseLibBF } from './response';
import { BOTTLE_FACTORY as loggerLibBF } from './logger';

import { BOTTLE_FACTORY as awsLibBF } from '../clients/aws';
import { BOTTLE_FACTORY as envLibBF } from '../clients/env';
import { BOTTLE_FACTORY as pgpLibBF } from '../clients/pgp';

import { BOTTLE_FACTORY as cognitoHelperServiceBF } from '../services/cognito_helper_service';
import { BOTTLE_FACTORY as lambdaEnvironmentHelperBF } from '../services/lambda_environment_helper';
import { BOTTLE_FACTORY as plaidAuthenticatorServiceBF } from '../services/plaid_authenticator_service';
import { BOTTLE_FACTORY as plaidDataServiceBF } from '../services/plaid_data_service';
import { BOTTLE_FACTORY as s3KeyGeneratorServiceBF } from '../services/s3_key_generator';
import { BOTTLE_FACTORY as userDashboardDataServiceBF } from '../services/user_dashboard_data_service';
import { BOTTLE_FACTORY as userStateBagServiceBF } from '../services/user_state_bag';

import { BOTTLE_FACTORY as getUserStateBagBF } from '../functions/get_user_state_bag';
import { BOTTLE_FACTORY as getUserDashboardDataBF } from '../functions/get_user_dashboard_data';
import { BOTTLE_FACTORY as saveUserStateBagBF } from '../functions/save_user_state_bag';

export const BOTTLE_NAMES = {
    NATIVE_ASSERT: 'native|assert',

    EXTERN_AWS_SDK: 'node_modules|aws-sdk',
    EXTERN_BLUEBIRD: 'node_modules|bluebird',
    EXTERN_NESTED_ERROR: 'node_modules|nested-error-stacks',
    EXTERN_OPENPGP: 'node_modules|openpgp',
    EXTERN_RAMDA: 'node_modules|ramda',
    EXTERN_ROLLBAR: 'node_modules|rollbar',

    LIB_HELPER: 'lib|helper',
    LIB_RESPONSE: 'lib|response',
    LIB_LOGGER: 'lib|logger',

    CLIENT_AWS: 'client|aws',
    CLIENT_ENV: 'client|env',
    CLIENT_PGP: 'client|pgp',

    SERVICE_COGNITO_HELPER: 'service|cognito_helper',
    SERVICE_LAMBDA_ENVIRONMENT_HELPER: 'service|lambda_environment_helper',
    SERVICE_PLAID_AUTHENTICATOR: 'service|plaid_authenticator',
    SERVICE_PLAID_DATA_SERVICE: 'service|plaid_data_service',
    SERVICE_S3_KEY_GENERATOR: 'service|s3_key_generator',
    SERVICE_USER_DASHBOARD_DATA: 'service|user_dashboard_data',
    SERVICE_USER_STATE_BAG: 'service|user_state_bag',

    FUNCTION_GET_USER_STATE_BAG: 'function|get_user_state_bag',
    FUNCTION_GET_USER_DASHBOARD_DATA: 'function|get_user_dashboard_data',
    FUNCTION_SAVE_USER_STATE_BAG: 'function|save_user_state_bag',
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
};

function buildBottle(overrides = {}) {
    const bottle = new Bottle();

    const factories = R.mergeAll([ {
        BOTTLE_NAMES: () => BOTTLE_NAMES,
        [BOTTLE_NAMES.NATIVE_ASSERT]: () => require('assert'),

        [BOTTLE_NAMES.EXTERN_AWS_SDK]: () => AWS,
        [BOTTLE_NAMES.EXTERN_BLUEBIRD]: () => Promise,
        [BOTTLE_NAMES.EXTERN_NESTED_ERROR]: () => NestedError,
        [BOTTLE_NAMES.EXTERN_OPENPGP]: () => openpgp,
        [BOTTLE_NAMES.EXTERN_PLAID]: (container) => {
            const envLib = container[BOTTLE_NAMES.CLIENT_ENV];

            return plaid.createClient(
                envLib.getEnvVar('PLAID_CLIENT_ID'),
                envLib.getEnvVar('PLAID_SECRET_KEY'),
                envLib.getEnvVar('PLAID_PUBLIC_KEY'),
                envLib.getEnvVar('PLAID_ENVIRONMENT'),
            );
        },
        [BOTTLE_NAMES.EXTERN_RAMDA]: () => R,
        [BOTTLE_NAMES.EXTERN_ROLLBAR]: () => Rollbar,

        [BOTTLE_NAMES.LIB_HELPER]: helperLibBF,
        [BOTTLE_NAMES.LIB_RESPONSE]: responseLibBF,
        [BOTTLE_NAMES.LIB_LOGGER]: loggerLibBF,

        [BOTTLE_NAMES.CLIENT_AWS]: awsLibBF,
        [BOTTLE_NAMES.CLIENT_ENV]: envLibBF,
        [BOTTLE_NAMES.CLIENT_PGP]: pgpLibBF,

        [BOTTLE_NAMES.SERVICE_COGNITO_HELPER]: cognitoHelperServiceBF,
        [BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER]: lambdaEnvironmentHelperBF,
        [BOTTLE_NAMES.SERVICE_PLAID_AUTHENTICATOR]: plaidAuthenticatorServiceBF,
        [BOTTLE_NAMES.SERVICE_PLAID_DATA_SERVICE]: plaidDataServiceBF,
        [BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR]: s3KeyGeneratorServiceBF,
        [BOTTLE_NAMES.SERVICE_USER_DASHBOARD_DATA]: userDashboardDataServiceBF,
        [BOTTLE_NAMES.SERVICE_USER_STATE_BAG]: userStateBagServiceBF,

        [BOTTLE_NAMES.FUNCTION_GET_USER_STATE_BAG]: getUserStateBagBF,
        [BOTTLE_NAMES.FUNCTION_GET_USER_DASHBOARD_DATA]: getUserDashboardDataBF,
        [BOTTLE_NAMES.FUNCTION_SAVE_USER_STATE_BAG]: saveUserStateBagBF,
    }, DEFAULT_BOTTLE_OVERRIDES, overrides ]);

    R.forEachObjIndexed((factory, name) => bottle.factory(name, factory), factories);

    return bottle;
}

export function wrapLambdaFunction(lambdaFn) {
    const bottle = buildBottle();
    const { rollbar } = bottle.container[BOTTLE_NAMES.LIB_LOGGER];

    return rollbar.lambdaHandler((event, context, callback) => {
        /** Immediate response for WarmUP plugin */
        if (event.source === 'serverless-plugin-warmup') {
            console.log('WarmUP - Lambda is warm!');
            return callback(null, 'Lambda is warm!');
        }

        return lambdaFn(event, context, bottle.container, callback);
    });
}

export function exportLambdaFunctions(lambdaFnBottleNamePairs) {
    const bottle = buildBottle();
    const { rollbar } = bottle.container[BOTTLE_NAMES.LIB_LOGGER];

    const handlerExports = {};
    lambdaFnBottleNamePairs.forEach(([ lambdaFnName, bottleName ]) => {
        handlerExports[lambdaFnName] = rollbar.lambdaHandler((event, context, callback) => {
            /** Immediate response for WarmUP plugin */
            if (event.source === 'serverless-plugin-warmup') {
                console.log('WarmUP - Lambda is warm!');
                return callback(null, 'Lambda is warm!');
            }

            return bottle.container[bottleName].handler(event, context, callback);
        });
    });

    return handlerExports;
}
