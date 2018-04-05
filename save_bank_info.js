import Promise from "bluebird";

import { success, failure } from "./libs/response-lib";
import { s3PutObject } from "./libs/aws-lib";
import { encryptText } from "./libs/pgp-lib";
import { obfuscate, executeAllPromises } from "./libs/helper-lib";

export async function main(event, context, callback) {
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
        encryptedS3Object = await encryptText(s3ObjectRawBody);
    } catch (e) {
        console.log('Error while encrypting data', e);
        callback(null, failure({ error: 'Error while encrypting data' }));
        return;
    }

    const encryptedS3UploadPromise = s3PutObject(
        process.env.USER_DATA_BUCKET,
        encryptedBankInfoKey,
        encryptedS3Object
    );

    const obfuscatedBankInfoKey = `${userId}/obfuscated_bank_info.json`;
    const obfuscatedS3Object = JSON.stringify({
        routingNumber: obfuscate(data.routingNumber, 4),
        accountNumber: obfuscate(data.accountNumber, 4),
    });

    const obfuscatedS3UploadPromise = s3PutObject(
        process.env.USER_DATA_BUCKET,
        obfuscatedBankInfoKey,
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
