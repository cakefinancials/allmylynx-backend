import { expect } from 'chai';
import simple from 'simple-mock';

import { BOTTLE_NAMES, testBottleBuilderFactory } from '../../../server/libs/bottle';
const buildTestBottle = testBottleBuilderFactory();

describe('plaid_authenticator_service_test', () => {
    let plaidAuthenticatorService;

    const setupTests = (overrides) => {
        const { bottle: { container } } = buildTestBottle(overrides);

        return container[BOTTLE_NAMES.SERVICE_PLAID_AUTHENTICATOR];
    };

    const plaidAccountId = 'test_account_id';
    const plaidPublicToken = 'test_public_token';

    describe('getStripeBankToken', () => {
        describe('when the public token exchange fails', () => {
            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: {
                        exchangePublicToken: simple.stub().rejectWith('SOMETHING')
                    }
                });
            });

            it('should throw and log', async () => {
                const err = await plaidAuthenticatorService.getStripeBankToken({
                    plaidAccountId, plaidPublicToken
                }).then(() => undefined, e => e);

                expect(err.name).to.equal(plaidAuthenticatorService.CONSTANTS.PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR);
            });
        });

        describe('when the stripe token creation fails', () => {
            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: {
                        exchangePublicToken: simple.stub().resolveWith({
                            access_token: 'SOME_TOKEN'
                        }),
                        createStripeToken: simple.stub().rejectWith('ERROR')
                    }
                });
            });

            it('should throw and log', async () => {
                const err = await plaidAuthenticatorService.getStripeBankToken({
                    plaidAccountId, plaidPublicToken
                }).then(() => undefined, e => e);

                expect(err.name).to.equal(plaidAuthenticatorService.CONSTANTS.STRIPE_TOKEN_EXCHANGE_ERROR);
            });
        });

        describe('when everything succeeds', () => {
            const access_token = 'SOME_TOKEN';
            const stripe_bank_account_token = 'SOME_BANK_TOKEN';
            const mockExternPlaid = {
                exchangePublicToken: simple.stub().resolveWith({ access_token }),
                createStripeToken: simple.stub().resolveWith({ stripe_bank_account_token })
            };

            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: mockExternPlaid
                });
            });

            it('should return the tokens', async () => {
                const tokens = await plaidAuthenticatorService.getStripeBankToken({
                    plaidAccountId, plaidPublicToken
                });

                expect(tokens).to.deep.equal({
                    bankAccountToken: stripe_bank_account_token,
                    plaidAccessToken: access_token,
                });

                expect(mockExternPlaid.exchangePublicToken.lastCall.args).to.deep.equal([
                    plaidPublicToken
                ]);

                expect(mockExternPlaid.createStripeToken.lastCall.args).to.deep.equal([
                    access_token,
                    plaidAccountId
                ]);
            });
        });
    });
});
