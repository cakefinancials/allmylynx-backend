export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;

    const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger('service.plaid_data');
    const s3KeyGeneratorService = container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR];

    const CONSTANTS = {
        WRITE_PLAID_DATA_ERROR: 'WritePlaidDataError',
        WRITE_PLAID_DATA_ERROR_MESSAGE: 'Failure writing plaid data to S3',
    };

    const SERVICE = {
        CONSTANTS,

        writePlaidData: async ({ userId, plaidAccountData }) => {
            const userPlaidDataKey = s3KeyGeneratorService.getUserPlaidDataKey(userId);
            const userDataBucket = envLib.getEnvVar('USER_DATA_BUCKET');

            try {
                await awsLib.s3PutObject(
                    userDataBucket,
                    userPlaidDataKey,
                    JSON.stringify(plaidAccountData)
                );

                return { success: true };
            } catch (error) {
                throw logger.createAndLogWrappedError(
                    CONSTANTS.WRITE_PLAID_DATA_ERROR,
                    CONSTANTS.WRITE_PLAID_DATA_ERROR_MESSAGE,
                    error,
                    { userPlaidDataKey, plaidAccountData }
                );
            }
        },
    };

    return SERVICE;
}
