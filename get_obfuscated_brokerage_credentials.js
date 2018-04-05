import { success, failure } from "./libs/response-lib";
import { s3GetObject } from "./libs/aws-lib";

export async function main(event, context, callback) {
    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/obfuscated_brokerage_credentials.json`

    try {
        const response = await s3GetObject(
            process.env.USER_DATA_BUCKET,
            objectKey
        );

        const obfuscatedData = JSON.parse(new String(response.Body));

        callback(null, success(obfuscatedData));
    } catch (e) {
        console.log(e);
        callback(null, failure({ error: 'Error while fetching obfuscated brokerage credentials object' }));
    }
}
