import AWS from "aws-sdk";
// for some reason, openpgp.key will be undefined unless we use require syntax
const openpgp = require('openpgp');

import { success, failure } from "./libs/response-lib";
import { s3PutObject } from "./libs/aws-lib";

export async function main(event, context, callback) {
    // Request body is passed in as a JSON encoded string in 'event.body'
    const data = JSON.parse(event.body);

    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/broker_credentials`

    try {
        const s3ObjectRawBody = JSON.stringify({
            username: data.username,
            password: data.password,
            brokerage: data.brokerage,
        });

        const encryptOptions = {
            data: s3ObjectRawBody,
            publicKeys: openpgp.key.readArmored(process.env.USER_DATA_PUBLIC_KEY).keys
        };

        const ciphertext = await openpgp.encrypt(encryptOptions);

        await s3PutObject(
            process.env.USER_DATA_BUCKET,
            objectKey,
            ciphertext.data
        );

        callback(null, success({ success: true }));
    } catch (e) {
        // log out errors so we can view them in cloudwatch logs
        console.log(e);
        callback(null, failure({ error: 'Error while saving data' }));
    }
}
