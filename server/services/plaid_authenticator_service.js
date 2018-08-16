export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const logger = container[BOTTLE_NAMES.LIB_LOGGER]
        .getContextualLogger('service.user_dashboard_data_service');
    const plaidClient = container[BOTTLE_NAMES.EXTERN_PLAID];

    const CONSTANTS = {
        PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR: 'StripeTokenExchangeError',
        PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR_MESSAGE: 'Could not exchange a plaid public token',

        STRIPE_TOKEN_EXCHANGE_ERROR: 'StripeTokenExchangeError',
        STRIPE_TOKEN_EXCHANGE_ERROR_MESSAGE: 'Could not create a stripe bank token'
    };

    const SERVICE = {
        CONSTANTS,
        getStripeBankToken: async ({ plaidAccountId, plaidPublicToken }) => {
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

            let bankAccountToken;
            try {
                const response = await plaidClient.createStripeToken(plaidAccessToken, plaidAccountId);
                bankAccountToken = response.stripe_bank_account_token;
            } catch (err) {
                throw logger.createAndLogWrappedError(
                    CONSTANTS.STRIPE_TOKEN_EXCHANGE_ERROR,
                    CONSTANTS.STRIPE_TOKEN_EXCHANGE_ERROR_MESSAGE,
                    err,
                    // TODO: maybe we should not log this, but we want to be able to recover on the back end
                    { plaidAccountId, plaidPublicToken, plaidAccessToken }
                );
            }

            return { bankAccountToken, plaidAccessToken };
        }
    };

    return SERVICE;
}
