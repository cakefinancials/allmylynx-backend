import { success, failure } from "./libs/response-lib";
import { s3HeadObject } from "./libs/aws-lib";

export async function main(event, context, callback) {
    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/brokerage_credentials`

    try {
        console.log(`Querying for ${objectKey}`);

        const response = await s3HeadObject(
            process.env.USER_DATA_BUCKET,
            objectKey
        );

        callback(null, success({ exists: true }));
    } catch (e) {
        if (e.code === 'NotFound') {
            callback(null, success({ exists: false }));
        } else {
            console.log(e);
            callback(null, failure({ error: 'Error while fetching brokerage credentials object' }));
        }
    }
}