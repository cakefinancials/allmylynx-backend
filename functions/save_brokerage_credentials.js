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
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger("save_brokerage_credentials.handler");

    // Request body is passed in as a JSON encoded string in 'event.body'
    const data = JSON.parse(event.body);

    const userId = event.requestContext.identity.cognitoIdentityId;
    const encryptedBrokerCredentialsKey = `${userId}/brokerage_credentials`

    const s3ObjectRawBody = JSON.stringify({
        username: data.username,
        password: data.password,
        brokerage: data.brokerage,
    });

    let encryptedS3Object;
    try {
        encryptedS3Object = await pgpLib.encryptText(s3ObjectRawBody);
    } catch (e) {
        logger.error(CONSTANTS.ENCRYPTING_DATA_FAILURE_MESSAGE, e);
        callback(null, responseLib.failure({ error: CONSTANTS.ENCRYPTING_DATA_FAILURE_MESSAGE }));
        return;
    }

    const USER_DATA_BUCKET = envLib.getEnvVar("USER_DATA_BUCKET");
    const encryptedS3UploadPromise = awsLib.s3PutObject(
        USER_DATA_BUCKET,
        encryptedBrokerCredentialsKey,
        encryptedS3Object
    );

    const obfuscatedBrokerageCredentials = `${userId}/obfuscated_brokerage_credentials.json`;
    const obfuscatedS3Object = JSON.stringify({
        username: helperLib.obfuscate(data.username, 4),
        brokerage: data.brokerage,
    });

    const obfuscatedS3UploadPromise = awsLib.s3PutObject(
        USER_DATA_BUCKET,
        obfuscatedBrokerageCredentials,
        obfuscatedS3Object
    );

    const results = await helperLib.executeAllPromises([
        encryptedS3UploadPromise,
        obfuscatedS3UploadPromise
    ]);

    if (results.errors.length > 0) {
        logger.error(CONSTANTS.S3_UPLOAD_FAILURE_MESSAGE, {errors: results.errors});
        callback(null, responseLib.failure({ error: CONSTANTS.S3_UPLOAD_FAILURE_MESSAGE }));
    } else {
        callback(null, responseLib.success({ success: true }));
    }
}

export const main = wrapLambdaFunction(handler);