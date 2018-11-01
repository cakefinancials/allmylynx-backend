export function BOTTLE_FACTORY(container) {
  const BOTTLE_NAMES = container.BOTTLE_NAMES;
  const logger = container[BOTTLE_NAMES.LIB_LOGGER].getContextualLogger('save_user_plaid_data.handler');

  const lambdaEnvironmentHelper = container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER];
  const plaidAuthenticatorService = container[BOTTLE_NAMES.SERVICE_PLAID_AUTHENTICATOR];
  const plaidDataService = container[BOTTLE_NAMES.SERVICE_PLAID_DATA];
  const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];

  const CONSTANTS = {
    FAILURE_MESSAGE: 'Failed to save the plaid credentials for the user',
    SAVE_USER_PLAID_DATA_ERROR: 'SaveUserPlaidDataError',
  };

  const SERVICE = {
    CONSTANTS,
    handler: async (event, context, callback) => {
      try {
        // need to check for previous and next here
        const httpBody = lambdaEnvironmentHelper.getHTTPBody(event);
        const { plaidPublicToken, plaidAccountId } = httpBody;

        const { plaidAccessToken } = await plaidAuthenticatorService.getPlaidAccessToken({
          plaidPublicToken,
          plaidAccountId,
        });

        const { institutionName } = await plaidAuthenticatorService.getPlaidInstitutionName({ plaidAccessToken });

        const userId = lambdaEnvironmentHelper.getCognitoIdentityId(event);
        const plaidAccountData = { plaidAccessToken, plaidPublicToken, plaidAccountId, institutionName };

        const writeResponse = await plaidDataService.writePlaidData({ userId, plaidAccountData });
        callback(null, responseLib.success(writeResponse));
      } catch (e) {
        logger.createAndLogWrappedError(CONSTANTS.SAVE_USER_PLAID_DATA_ERROR, CONSTANTS.FAILURE_MESSAGE, e, {
          event,
          context,
        });
        callback(null, responseLib.failure({ error: CONSTANTS.FAILURE_MESSAGE }));
      }
    },
  };

  return SERVICE;
}
