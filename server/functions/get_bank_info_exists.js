import { BOTTLE_NAMES, wrapLambdaFunction } from '../libs/bottle';

export const CONSTANTS = {
  FAILURE_MESSAGE: 'Error while fetching bank account object',
};

export const handler = async function(event, context, container, callback) {
  const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
  const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
  const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
  const logger = container[BOTTLE_NAMES.LIB_LOGGER].getContextualLogger('get_bank_info_exists.handler');

  const userId = event.requestContext.identity.cognitoIdentityId;
  const objectKey = `${userId}/user_plaid_data.json`;

  try {
    logger.log(`Querying for ${objectKey}`);

    const response = await awsLib.s3GetObject(envLib.getEnvVar('USER_DATA_BUCKET'), objectKey);

    const bankData = JSON.parse(new String(response.Body));

    callback(null, responseLib.success({ bankData }));
  } catch (e) {
    if (e.code === 'NoSuchKey') {
      callback(null, responseLib.success({ bankData: null }));
    } else {
      logger.error(CONSTANTS.FAILURE_MESSAGE, e);
      callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
    }
  }
};

export const main = wrapLambdaFunction(handler);
