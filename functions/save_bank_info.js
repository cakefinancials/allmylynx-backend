import Promise from "bluebird";

import { BOTTLE_NAMES, wrapLambdaFunction } from "../libs/bottle";

export const CONSTANTS = {
    ENCRYPTING_DATA_FAILURE_MESSAGE: "Error while encrypting data",
    S3_UPLOAD_FAILURE_MESSAGE: "Errors while saving bank info data"
};

export const handler = async function (event, context, container, callback) {
    const awsLib = container[BOTTLE_NAMES.LIB_AWS];
    const envLib = container[BOTTLE_NAMES.LIB_ENV];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
    const pgpLib = container[BOTTLE_NAMES.LIB_PGP];
    const helperLib = container[BOTTLE_NAMES.LIB_HELPER];
    const rollbar = container[BOTTLE_NAMES.LIB_ROLLBAR];

    // Request body is passed in as a JSON encoded string in 'event.body'
    const data = JSON.parse(event.body);

    const userId = event.requestContext.identity.cognitoIdentityId;

    const encryptedBankInfoKey = `${userId}/bank_info`;

    const s3ObjectRawBody = JSON.stringify({
        routingNumber: data.routingNumber,
        accountNumber: data.accountNumber,
    });

    let encryptedS3Object;
    try {
        encryptedS3Object = await pgpLib.encryptText(s3ObjectRawBody);
    } catch (e) {
        rollbar.error(CONSTANTS.ENCRYPTING_DATA_FAILURE_MESSAGE, {error: e});
        callback(null, responseLib.failure({ error: CONSTANTS.ENCRYPTING_DATA_FAILURE_MESSAGE }));
        return;
    }

    const USER_DATA_BUCKET = envLib.getEnvVar("USER_DATA_BUCKET");
    const encryptedS3UploadPromise = awsLib.s3PutObject(
        USER_DATA_BUCKET,
        encryptedBankInfoKey,
        encryptedS3Object
    );

    const obfuscatedBankInfoKey = `${userId}/obfuscated_bank_info.json`;
    const obfuscatedS3Object = JSON.stringify({
        routingNumber: helperLib.obfuscate(data.routingNumber, 4),
        accountNumber: helperLib.obfuscate(data.accountNumber, 4),
    });

    const obfuscatedS3UploadPromise = awsLib.s3PutObject(
        USER_DATA_BUCKET,
        obfuscatedBankInfoKey,
        obfuscatedS3Object
    );

    const results = await helperLib.executeAllPromises([
        encryptedS3UploadPromise,
        obfuscatedS3UploadPromise
    ]);

    if (results.errors.length > 0) {
        rollbar.error(CONSTANTS.S3_UPLOAD_FAILURE_MESSAGE, {custom: {errors: results.errors}});
        callback(null, responseLib.failure({ error: CONSTANTS.S3_UPLOAD_FAILURE_MESSAGE }));
    } else {
        callback(null, responseLib.success({ success: true }));
    }
}

export const main = wrapLambdaFunction(handler);