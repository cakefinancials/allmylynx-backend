export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger('get_user_state_bag.handler');

    const lambdaEnvironmentHelper = container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
    const userStateBagService = container[BOTTLE_NAMES.SERVICE_USER_STATE_BAG];

    const CONSTANTS = {
        FAILURE_MESSAGE: 'Failed to retrieve the state bag for the user',
        GET_USER_STATE_BAG_ERROR: 'GetUserStateBagError'
    };

    const SERVICE = {
        CONSTANTS,
        handler: async (event, context, callback) => {
            try {
                const userId = lambdaEnvironmentHelper.getCognitoIdentityId(event);

                const userStateBag = await userStateBagService.readUserState(userId);
                callback(null, responseLib.success(userStateBag));
            } catch (e) {
                logger.createAndLogWrappedError(
                    CONSTANTS.GET_USER_STATE_BAG_ERROR,
                    CONSTANTS.FAILURE_MESSAGE,
                    e,
                    { event, context }
                );
                callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
            }
        }
    };

    return SERVICE;
}
