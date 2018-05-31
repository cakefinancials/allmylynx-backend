export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger("save_user_state_bag.handler");

    const lambdaEnvironmentHelper = container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
    const userStateBagService = container[BOTTLE_NAMES.SERVICE_USER_STATE_BAG];

    const CONSTANTS = {
        FAILURE_MESSAGE: 'Failed to save the state bag for the user'
    };

    const SERVICE = {
        CONSTANTS,
        handler: async (event, context, callback) => {
            try {
                const userId = lambdaEnvironmentHelper.getCognitoIdentityId(event);
                // need to check for previous and next here
                const userState = lambdaEnvironmentHelper.getHTTPBody(event);

                const writeResponse = await userStateBagService.writeUserState(userId, userState);
                callback(null, responseLib.success(writeResponse));
            } catch (e) {
                const wrappedError = logger.createWrappedError(
                    'SaveUserStateBagError',
                    CONSTANTS.FAILURE_MESSAGE,
                    e
                );
                logger.error(wrappedError, { event, context });
                callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
            }
        }
    };

    return SERVICE;
}
