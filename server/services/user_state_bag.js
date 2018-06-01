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

    const assert = container[BOTTLE_NAMES.NATIVE_ASSERT];
    const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger("service.user_state_bag");
    const NestedError = container[BOTTLE_NAMES.EXTERN_NESTED_ERROR];
    const s3KeyGeneratorService = container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR];

    const CONSTANTS = {
        READ_USER_STATE_ERROR: "ReadUserStateError",
        READ_USER_STATE_FAILURE_MESSAGE: "Failed to read user state",
        WRITE_USER_STATE_ERROR: "WriteUserStateError",
        WRITE_USER_STATE_FAILURE_MESSAGE: "Failed to write user state",
        VERIFY_PREVIOUS_EQUALS_CURRENT_ERROR: "VerifyPreviousEqualsCurrentError",
        VERIFY_PREVIOUS_EQUALS_CURRENT_FAILURE_MESSAGE: "Failed to write user state",
    };

    const SERVICE = {
        CONSTANTS,

        verifyPreviousStateEqualsCurrentState: (previousState, currentState) => {
            try {
                assert.deepStrictEqual(
                    previousState,
                    currentState
                );
            } catch (e) {
                throw logger.createAndLogWrappedError(
                    CONSTANTS.VERIFY_PREVIOUS_EQUALS_CURRENT_ERROR,
                    CONSTANTS.VERIFY_PREVIOUS_EQUALS_CURRENT_FAILURE_MESSAGE,
                    e,
                    { previousState, currentState }
                );
            }
        },

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
                throw logger.createAndLogWrappedError(
                    CONSTANTS.WRITE_USER_STATE_ERROR,
                    CONSTANTS.WRITE_USER_STATE_FAILURE_MESSAGE,
                    error,
                    { userStateBagKey, userState }
                );
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

                throw logger.createAndLogWrappedError(
                    CONSTANTS.READ_USER_STATE_ERROR,
                    CONSTANTS.READ_USER_STATE_FAILURE_MESSAGE,
                    error,
                    { userStateBagKey }
                );
            }
        },
    };

    return SERVICE;
}
