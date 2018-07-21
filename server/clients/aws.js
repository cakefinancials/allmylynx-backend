export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const AWS = container[BOTTLE_NAMES.EXTERN_AWS_SDK];
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];

    AWS.config.update({ region: envLib.getEnvVar("AWS_SDK_REGION") });

    const SERVICE = {
        s3PutObject: (bucket, key, body, s3Config = {}) => {
            const s3 = new AWS.S3(s3Config);

            const params = {
                Bucket: bucket,
                Key: key,
                Body: body
            };

            return s3.putObject(params).promise();
        },

        s3HeadObject: (bucket, key, s3Config = {}) => {
            const s3 = new AWS.S3(s3Config);

            const params = {
                Bucket: bucket,
                Key: key
            };

            return s3.headObject(params).promise();
        },

        s3GetObject: (bucket, key, s3Config = {}) => {
            const s3 = new AWS.S3(s3Config);

            const params = {
                Bucket: bucket,
                Key: key
            };

            return s3.getObject(params).promise();
        },

        cognitoIdentityServiceProviderCall: (action, params) => {
            const client = new AWS.CognitoIdentityServiceProvider();

            return client[action](params).promise();
        },
    };

    return SERVICE;
}
