import { BOTTLE_NAMES } from "./bottle";

export function BOTTLE_FACTORY(container) {
    const AWS = container[BOTTLE_NAMES.EXTERN_AWS_SDK];
    const envLib = container[BOTTLE_NAMES.LIB_ENV];

    AWS.config.update({ region: envLib.getEnvVar("AWS_REGION") });

    const s3 = new AWS.S3();

    const SERVICE = {
        s3PutObject: (bucket, key, body) => {
            const params = {
                Bucket: bucket,
                Key: key,
                Body: body
            };

            return s3.putObject(params).promise();
        },

        s3HeadObject: (bucket, key) => {
            const params = {
                Bucket: bucket,
                Key: key
            };

            return s3.headObject(params).promise();
        },

        s3GetObject: (bucket, key) => {
            const params = {
                Bucket: bucket,
                Key: key
            };

            return s3.getObject(params).promise();
        },

        dynamoDBCall: (action, params) => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();

            return dynamoDb[action](params).promise();
        },

        cognitoIdentityServiceProviderCall: (action, params) => {
            const client = new AWS.CognitoIdentityServiceProvider();

            return client[action](params).promise();
        },
    };

    return SERVICE;
}
