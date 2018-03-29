import AWS from "aws-sdk";

import { success, failure } from "./libs/response-lib";
import { s3PutObject } from "./libs/aws-lib";
import { encryptText } from "./libs/pgp-lib";

export async function main(event, context, callback) {
    // Request body is passed in as a JSON encoded string in 'event.body'
    const data = JSON.parse(event.body);

    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/bank_info`

    try {
        console.log(`Encrypting and uploading ${objectKey}`);

        const s3ObjectRawBody = JSON.stringify({
            routingNumber: data.routingNumber,
            accountNumber: data.accountNumber,
        });

        const encryptedS3Object = await encryptText(s3ObjectRawBody);

        await s3PutObject(
            process.env.USER_DATA_BUCKET,
            objectKey,
            encryptedS3Object
        );

        callback(null, success({ success: true }));
    } catch (e) {
        // log out errors so we can view them in cloudwatch logs
        console.log(e);
        callback(null, failure({ error: 'Error while saving bank info data' }));
    }
}
