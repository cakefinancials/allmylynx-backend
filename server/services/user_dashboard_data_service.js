export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;

    const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger("service.user_dashboard_data_service");
    const s3KeyGeneratorService = container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR];

    const CONSTANTS = {
        DASHBOARD_DATA_UNAVAILABLE: "DASHBOARD_DATA_UNAVAILABLE",
        READ_USER_DASHBOARD_DATA_ERROR: "ReadUserDashboardDataError",
        READ_USER_DASHBOARD_DATA_ERROR_MESSAGE: "Error while trying to read the user's dashboard data",
    };

    const SERVICE = {
        CONSTANTS,

        getUserDashboardData: async (userEmail) => {
            const userDashboardDataKey = s3KeyGeneratorService.getUserDashboardDataKey(userEmail);
            const userDashboardDataBucket = envLib.getEnvVar("USER_DASHBOARD_DATA_BUCKET");
            const userDashboardDataBucketRegion = envLib.getEnvVar("USER_DASHBOARD_DATA_BUCKET_REGION");

            try {
                const response = await awsLib.s3GetObject(
                    userDashboardDataBucket,
                    userDashboardDataKey,
                    { region: userDashboardDataBucketRegion }
                );

                const userDashboardData = JSON.parse(new String(response.Body));
                return userDashboardData;
            } catch (error) {
                if (error.code === "NoSuchKey") {
                    return CONSTANTS.DASHBOARD_DATA_UNAVAILABLE;
                }

                throw logger.createAndLogWrappedError(
                    CONSTANTS.READ_USER_DASHBOARD_DATA_ERROR,
                    CONSTANTS.READ_USER_DASHBOARD_DATA_ERROR_MESSAGE,
                    error,
                    { userEmail, userStateBagKey }
                );
            }
        },
    };

    return SERVICE;
}
