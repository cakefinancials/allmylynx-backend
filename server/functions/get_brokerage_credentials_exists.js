import { BOTTLE_NAMES, wrapLambdaFunction } from '../libs/bottle';

export const CONSTANTS = {
  FAILURE_MESSAGE: 'Error while fetching brokerage credentials object',
};

export const handler = async function(event, context, container, callback) {
  const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
  const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
  const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
  const logger = container[BOTTLE_NAMES.LIB_LOGGER].getContextualLogger('get_brokerage_credentials_exists.handler');

  const userId = event.requestContext.identity.cognitoIdentityId;
  const objectKey = `${userId}/brokerage_credentials`;

  try {
    logger.log(`Querying for ${objectKey}`);

    const response = await awsLib.s3HeadObject(envLib.getEnvVar('USER_DATA_BUCKET'), objectKey);

    callback(null, responseLib.success({ exists: true }));
  } catch (e) {
    if (e.code === 'NotFound') {
      callback(null, responseLib.success({ exists: false }));
    } else {
      logger.error(CONSTANTS.FAILURE_MESSAGE, e);
      callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
    }
  }
};

export const main = wrapLambdaFunction(handler);
