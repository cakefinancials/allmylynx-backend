export function BOTTLE_FACTORY(container) {
  const BOTTLE_NAMES = container.BOTTLE_NAMES;
  const logger = container[BOTTLE_NAMES.LIB_LOGGER].getContextualLogger('service.user_dashboard_data_service');
  const plaidClient = container[BOTTLE_NAMES.EXTERN_PLAID];
  const R = container[BOTTLE_NAMES.EXTERN_RAMDA];

  const CONSTANTS = {
    PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR: 'PlaidExchangePublicTokenError',
    PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR_MESSAGE: 'Could not exchange a plaid public token',

    PLAID_GET_INSTITUTION_NAME_ERROR: 'PlaidGetInstitutionNameError',
    PLAID_GET_INSTITUTION_NAME_ERROR_MESSAGE: 'Could not get the institution name for the plaid account',
  };

  const SERVICE = {
    CONSTANTS,
    getPlaidAccessToken: async ({ plaidAccountId, plaidPublicToken }) => {
      let plaidAccessToken;
      try {
        const response = await plaidClient.exchangePublicToken(plaidPublicToken);

        plaidAccessToken = response.access_token;
      } catch (err) {
        throw logger.createAndLogWrappedError(
          CONSTANTS.PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR,
          CONSTANTS.PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR_MESSAGE,
          err,
          { plaidAccountId, plaidPublicToken }
        );
      }

      return { plaidAccessToken };
    },

    getPlaidInstitutionName: async ({ plaidAccessToken }) => {
      let institutionName;
      try {
        const response = await plaidClient.getAuth(plaidAccessToken);

        const institutionId = R.path(['item', 'institution_id'], response);

        if (R.isNil(institutionId)) {
          return { institutionName: null };
        }

        const institutionResponse = await plaidClient.getInstitutionById(institutionId);

        institutionName = R.path(['institution', 'name'], institutionResponse);
      } catch (err) {
        throw logger.createAndLogWrappedError(
          CONSTANTS.PLAID_GET_INSTITUTION_NAME_ERROR,
          CONSTANTS.PLAID_GET_INSTITUTION_NAME_ERROR_MESSAGE,
          err,
          { plaidAccessToken }
        );
      }

      return { institutionName };
    },
  };

  return SERVICE;
}
