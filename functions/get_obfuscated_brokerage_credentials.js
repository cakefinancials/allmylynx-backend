import { BOTTLE_NAMES, wrapLambdaFunction } from "../libs/bottle";

export const CONSTANTS = {
    FAILURE_MESSAGE: "Error while fetching obfuscated brokerage credentials object"
};

export const handler = async function (event, context, container, callback) {
    const awsLib = container[BOTTLE_NAMES.LIB_AWS];
    const envLib = container[BOTTLE_NAMES.LIB_ENV];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
    const rollbar = container[BOTTLE_NAMES.LIB_ROLLBAR]
        .getContextualRollbar("get_obfuscated_brokerage_credentials.handler");

    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/obfuscated_brokerage_credentials.json`

    try {
        const response = await awsLib.s3GetObject(
            envLib.getEnvVar("USER_DATA_BUCKET"),
            objectKey
        );

        const obfuscatedData = JSON.parse(new String(response.Body));

        callback(null, responseLib.success(obfuscatedData));
    } catch (e) {
        rollbar.error(CONSTANTS.FAILURE_MESSAGE, e);
        callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
    }
}

export const main = wrapLambdaFunction(handler);