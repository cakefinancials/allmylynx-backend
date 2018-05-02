import { BOTTLE_NAMES, wrapLambdaFunction } from "../libs/bottle";

export const CONSTANTS = {
    FAILURE_MESSAGE: "Error while fetching obfuscated bank info object"
};

export const handler = async function (event, context, container, callback) {
    const awsLib = container[BOTTLE_NAMES.LIB_AWS];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];

    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/obfuscated_bank_info.json`

    try {
        const response = await awsLib.s3GetObject(
            process.env.USER_DATA_BUCKET,
            objectKey
        );

        const obfuscatedData = JSON.parse(new String(response.Body));

        callback(null, responseLib.success(obfuscatedData));
    } catch (e) {
        console.log(e);
        callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
    }
}

export const main = wrapLambdaFunction(handler);