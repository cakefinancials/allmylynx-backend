import { success, failure } from "./libs/response-lib";
import * as awsLib from "./libs/aws-lib";

export const CONSTANTS = {
    FAILURE_MESSAGE: "Error while fetching bank account object"
};

export async function main(event, context, callback) {
    const userId = event.requestContext.identity.cognitoIdentityId;
    const objectKey = `${userId}/bank_info`

    try {
        console.log(`Querying for ${objectKey}`);

        const response = await awsLib.s3HeadObject(
            process.env.USER_DATA_BUCKET,
            objectKey
        );

        callback(null, success({ exists: true }));
    } catch (e) {
        if (e.code === 'NotFound') {
            callback(null, success({ exists: false }));
        } else {
            console.log(e);
            callback(null, failure({ error: CONSTANTS.FAILURE_MESSAGE }));
        }
    }
}
