import Promise from "bluebird";

import { success, failure } from "./libs/response-lib";
import * as awsLib from "./libs/aws-lib";
import { encryptText } from "./libs/pgp-lib";
import { obfuscate, executeAllPromises } from "./libs/helper-lib";

export async function main(event, context, callback) {
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
        encryptedS3Object = await encryptText(s3ObjectRawBody);
    } catch (e) {
        console.log('Error while encrypting data', e);
        callback(null, failure({ error: 'Error while encrypting data' }));
        return;
    }

    const encryptedS3UploadPromise = awsLib.s3PutObject(
        process.env.USER_DATA_BUCKET,
        encryptedBrokerCredentialsKey,
        encryptedS3Object
    );

    const obfuscatedBrokerageCredentials = `${userId}/obfuscated_brokerage_credentials.json`;
    const obfuscatedS3Object = JSON.stringify({
        username: obfuscate(data.username, 4),
        brokerage: data.brokerage,
    });

    const obfuscatedS3UploadPromise = awsLib.s3PutObject(
        process.env.USER_DATA_BUCKET,
        obfuscatedBrokerageCredentials,
        obfuscatedS3Object
    );

    const results = await executeAllPromises([encryptedS3UploadPromise, obfuscatedS3UploadPromise]);

    if (results.errors.length > 0) {
        console.log('Errors while saving bank info data', {errors: results.errors});
        callback(null, failure({ error: 'Error while saving bank info data' }));
    } else {
        callback(null, success({ success: true }));
    }
}
