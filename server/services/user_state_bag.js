/**
 * As users start onboarding into our system, we're going to need to keep track of state
 * data. This could be how far along they've gone in the signup process, etc...
 *
 * We model this state bag by having a simple S3 blob that we save and retrieve. This is
 * the simplest thing to do for now, and as long as we don't need to worry about doing any
 * kind of joins or analytics we can run with this for a while. Note that as soon as we
 * want to start answering any kind of complicated business questions, we should consider
 * moving this data to a relational database.
 */

export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;

    const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger("service.user_state_bag");
    const NestedError = container[BOTTLE_NAMES.EXTERN_NESTED_ERROR];
    const s3KeyGeneratorService = container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR];

    const CONSTANTS = {
        READ_USER_STATE_FAILURE_MESSAGE: "Failed to read user state",
        WRITE_USER_STATE_FAILURE_MESSAGE: "Failed to write user state"
    };

    const SERVICE = {
        CONSTANTS,

        writeUserState: async (userId, userState) => {
            const userStateBagKey = s3KeyGeneratorService.getUserStateBagKey(userId);
            const userDataBucket = envLib.getEnvVar("USER_DATA_BUCKET");

            try {
                await awsLib.s3PutObject(
                    userDataBucket,
                    userStateBagKey,
                    JSON.stringify(userState)
                );

                return { success: true };
            } catch (error) {
                const wrappedError = logger.createWrappedError(
                    'WriteUserStateError',
                    CONSTANTS.WRITE_USER_STATE_FAILURE_MESSAGE,
                    error
                );

                logger.error(
                    wrappedError,
                    {
                        userStateBagKey,
                        userState
                    }
                );

                throw wrappedError;
            }
        },

        readUserState: async (userId) => {
            const userStateBagKey = s3KeyGeneratorService.getUserStateBagKey(userId);
            const userDataBucket = envLib.getEnvVar("USER_DATA_BUCKET");

            try {
                const response = await awsLib.s3GetObject(
                    userDataBucket,
                    userStateBagKey
                );

                const userStateBag = JSON.parse(new String(response.Body));
                return userStateBag;
            } catch (error) {
                if (error.code === "NoSuchKey") {
                    return {};
                }

                const nestedError = new NestedError(CONSTANTS.READ_USER_STATE_FAILURE_MESSAGE, error);

                logger.error(
                    CONSTANTS.READ_USER_STATE_FAILURE_MESSAGE,
                    nestedError,
                    { userStateBagKey }
                );

                throw nestedError;
            }
        },
    };

    return SERVICE;
}
