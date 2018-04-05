import AWS from "aws-sdk";

AWS.config.update({ region: "us-east-2" });

const s3 = new AWS.S3();

export function s3PutObject(bucket, key, body) {
    const params = {
        Bucket: bucket,
        Key: key,
        Body: body
    };

    return s3.putObject(params).promise();
}

export function s3HeadObject(bucket, key) {
    const params = {
        Bucket: bucket,
        Key: key
    };

    return s3.headObject(params).promise();
}

export function s3GetObject(bucket, key) {
    const params = {
        Bucket: bucket,
        Key: key
    };

    return s3.getObject(params).promise();
}
