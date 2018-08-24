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

    describe('getPlaidAccessToken', () => {
        describe('when the public token exchange fails', () => {
            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: {
                        exchangePublicToken: simple.stub().rejectWith('SOMETHING')
                    }
                });
            });

            it('should throw and log', async () => {
                const err = await plaidAuthenticatorService.getPlaidAccessToken({
                    plaidAccountId, plaidPublicToken
                }).then(() => undefined, e => e);

                expect(err.name).to.equal(plaidAuthenticatorService.CONSTANTS.PLAID_EXCHANGE_PUBLIC_TOKEN_ERROR);
            });
        });

        describe('when everything succeeds', () => {
            const access_token = 'SOME_TOKEN';
            const mockExternPlaid = {
                exchangePublicToken: simple.stub().resolveWith({ access_token }),
            };

            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: mockExternPlaid
                });
            });

            it('should return the tokens', async () => {
                const tokens = await plaidAuthenticatorService.getPlaidAccessToken({
                    plaidAccountId, plaidPublicToken
                });

                expect(tokens).to.deep.equal({
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

    describe.only('getPlaidInstitutionName', () => {
        const plaidAccessToken = 'some_access_token';

        describe('when one of the plaid calls fail', () => {
            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: {
                        getAuth: simple.stub().rejectWith('SOMETHING')
                    }
                });
            });

            it('should throw and log', async () => {
                const err = await plaidAuthenticatorService.getPlaidInstitutionName({
                    plaidAccessToken
                }).then(() => undefined, e => e);

                expect(err.name).to.equal(plaidAuthenticatorService.CONSTANTS.PLAID_GET_INSTITUTION_NAME_ERROR);
            });
        });

        describe('when no institution id is found', () => {
            const authResponse = { item: { } };

            const mockExternPlaid = {
                getAuth: simple.stub().resolveWith(authResponse),
            };

            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: mockExternPlaid
                });
            });

            it('should return the institution name', async () => {
                const institutionName = await plaidAuthenticatorService.getPlaidInstitutionName({
                    plaidAccessToken
                });

                expect(institutionName).to.deep.equal({
                    institutionName: null,
                });
            });
        });

        describe('when everything succeeds and we got a name', () => {
            const authResponse = { item: { institution_id: '123' } };
            const institutionResponse = { institution: { name: 'Ally Bank' } };

            const mockExternPlaid = {
                getAuth: simple.stub().resolveWith(authResponse),
                getInstitutionById: simple.stub().resolveWith(institutionResponse),
            };

            before(() => {
                plaidAuthenticatorService = setupTests({
                    [BOTTLE_NAMES.EXTERN_PLAID]: mockExternPlaid
                });
            });

            it('should return the institution name', async () => {
                const institutionName = await plaidAuthenticatorService.getPlaidInstitutionName({
                    plaidAccessToken
                });

                expect(institutionName).to.deep.equal({
                    institutionName: institutionResponse.institution.name,
                });

                expect(mockExternPlaid.getAuth.lastCall.args).to.deep.equal([
                    plaidAccessToken
                ]);

                expect(mockExternPlaid.getInstitutionById.lastCall.args).to.deep.equal([
                    authResponse.item.institution_id
                ]);
            });
        });
    });
});
