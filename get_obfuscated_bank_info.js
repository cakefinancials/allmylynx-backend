import { success, failure } from "./libs/response";
import * as awsLib from "./libs/aws";

export async function main(event, context, callback) {
    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/obfuscated_bank_info.json`

    try {
        const response = await awsLib.s3GetObject(
            process.env.USER_DATA_BUCKET,
            objectKey
        );

        const obfuscatedData = JSON.parse(new String(response.Body));

        callback(null, success(obfuscatedData));
    } catch (e) {
        console.log(e);
        callback(null, failure({ error: 'Error while fetching obfuscated bank info object' }));
    }
}
