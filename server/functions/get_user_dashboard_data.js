export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;

    const cognitoHelperService = container[BOTTLE_NAMES.SERVICE_COGNITO_HELPER];
    const userDashboardDataService = container[BOTTLE_NAMES.SERVICE_USER_DASHBOARD_DATA];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];

    const CONSTANTS = {
        GET_USER_EMAIL_ERROR_MESSAGE: 'Failure while trying to resolve the user\'s email',
        GET_USER_DASHBOARD_DATA_FETCH_ERROR_MESSAGE: 'Failure while trying to fetch the user\'s dashboard data',
    };

    const SERVICE = {
        CONSTANTS,
        handler: async (event, context, callback) => {
            let email;
            try {
                email = await cognitoHelperService.getUserEmailFromLambdaEvent(event);
            } catch (err) {
                callback(null, responseLib.failure({ error: CONSTANTS.GET_USER_EMAIL_ERROR_MESSAGE }));
                return;
            }

            let dashboardData;
            try {
                dashboardData = await userDashboardDataService.getUserDashboardData(email);
            } catch (err) {
                callback(null, responseLib.failure({ error: CONSTANTS.GET_USER_DASHBOARD_DATA_FETCH_ERROR_MESSAGE }));
                return;
            }

            callback(null, responseLib.success(dashboardData));
        }
    };

    return SERVICE;
}
