const awsConfig = require('aws-config');
const AWS = require('aws-sdk');
const {S3_BUCKET_NAME} = require('../config');

const s3 = new AWS.S3({});

/**
 *
 * @param key
 * @return {Promise<{data: S3.Body, contentType: S3.ContentType}>}
 */
const getObject = async key => {

    const options = {
        Bucket: S3_BUCKET_NAME,
        Key: key
    };

    let resp;
    try {
        resp = await s3.getObject(options).promise();
        resp = {contentType: resp['ContentType'], data: resp.Body};
    } catch (err) {
        throw err;
    }

    return resp;
};

/**
 *
 * @param key
 * @param body
 * @return {Promise<S3.PutObjectOutput & {$response: Response<S3.PutObjectOutput, Error & {code: string; message: string; retryable?: boolean; statusCode?: number; time: Date; hostname?: string; region?: string; retryDelay?: number; requestId?: string; extendedRequestId?: string; cfId?: string; originalError?: Error}>}>}
 */
const putObject = async (key, body) => {

    const options = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: body,
    };

    let resp;
    try {
        resp = await s3.putObject(options).promise();
    } catch (err) {
        throw err;
    }

    return resp;
};


module.exports = {
    getObject,
    putObject
};
