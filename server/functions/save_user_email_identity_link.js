import { BOTTLE_NAMES, wrapLambdaFunction } from '../libs/bottle';

export const CONSTANTS = {
    GET_USER_EMAIL_ERROR_MESSAGE: 'Failure while trying to resolve the user\'s email',
    SAVE_COGNITO_LINK_FAILURE_MESSAGE: 'Error while saving email to cognito id link'
};

export const handler = async function (event, context, container, callback) {
    const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
    const cognitoHelperService = container[BOTTLE_NAMES.SERVICE_COGNITO_HELPER];
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
    const helperLib = container[BOTTLE_NAMES.LIB_HELPER];
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger('save_user_email_identity_link.handler');

    let email;
    try {
        email = await cognitoHelperService.getUserEmailFromLambdaEvent(event);
    } catch (err) {
        callback(null, responseLib.failure({ error: CONSTANTS.GET_USER_EMAIL_FAILURE }));
        return;
    }

    const cognitoId = event.requestContext.identity.cognitoIdentityId;

    const userEmailIdentityLink = `email_to_cognito_id/${email}/${cognitoId}`;

    const USER_DATA_BUCKET = envLib.getEnvVar('USER_DATA_BUCKET');
    const createLinkPromise = awsLib.s3PutObject(
        USER_DATA_BUCKET,
        userEmailIdentityLink,
        ''
    );

    const results = await helperLib.executeAllPromises([ createLinkPromise ]);

    if (results.errors.length > 0) {
        logger.error(CONSTANTS.SAVE_COGNITO_LINK_FAILURE_MESSAGE, { errors: results.errors });
        callback(null, responseLib.failure({ error: CONSTANTS.SAVE_COGNITO_LINK_FAILURE_MESSAGE }));
    } else {
        callback(null, responseLib.success({ success: true }));
    }
}

export const main = wrapLambdaFunction(handler);