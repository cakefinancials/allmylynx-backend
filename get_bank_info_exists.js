import { BOTTLE_NAMES, wrapLambdaFunction } from "./libs/bottle";

export const CONSTANTS = {
    FAILURE_MESSAGE: "Error while fetching bank account object"
};

export const main = wrapLambdaFunction(async function (event, context, callback, container) {
    const awsLib = container[BOTTLE_NAMES.LIB_AWS];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];

    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/bank_info`

    try {
        console.log(`Querying for ${objectKey}`);

        const response = await awsLib.s3HeadObject(
            process.env.USER_DATA_BUCKET,
            objectKey
        );

        callback(null, responseLib.success({ exists: true }));
    } catch (e) {
        if (e.code === 'NotFound') {
            callback(null, responseLib.success({ exists: false }));
        } else {
            console.log(e);
            callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
        }
    }
});
