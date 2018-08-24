import { expect } from 'chai';
import simple from 'simple-mock';
import * as R from 'ramda';
import util from 'util';

import { BOTTLE_NAMES, testBottleBuilderFactory } from '../../../server/libs/bottle';
const buildTestBottle = testBottleBuilderFactory();

describe('save_user_plaid_data_test', () => {
    let saveUserPlaidDataService;

    const event = 'some_event';
    const context = 'some_context';
    const userId = 'some_user_id';
    const plaidPublicToken = 'some_public_token';
    const plaidAccountId = 'some_plaid_account_id';
    const plaidAccessToken = 'some_plaid_access_token';
    const institutionName = 'some_plaid_institution';
    const plaidDataWriteResponse = 'some_plaid_data_write_response';

    const setupTests = (overrides = {}) => {
        const createAndLogWrappedErrorStub = simple.stub();

        const mocks = R.merge(
            {
                [BOTTLE_NAMES.LIB_LOGGER]: {
                    createAndLogWrappedErrorStub,
                    getContextualLogger: () => ({
                        createAndLogWrappedError: createAndLogWrappedErrorStub
                    })
                },
                [BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER]: {
                    getHTTPBody: simple.stub().returnWith({ plaidPublicToken, plaidAccountId }),
                    getCognitoIdentityId: simple.stub().returnWith(userId)
                },
                [BOTTLE_NAMES.SERVICE_PLAID_AUTHENTICATOR]: {
                    getPlaidAccessToken: simple.stub().returnWith({ plaidAccessToken }),
                    getPlaidInstitutionName: simple.stub().returnWith({ institutionName }),
                },
                [BOTTLE_NAMES.SERVICE_PLAID_DATA]: {
                    writePlaidData: simple.stub().resolveWith(plaidDataWriteResponse)
                },
            },
            overrides
        );

        const { bottle: { container } } = buildTestBottle(mocks);

        saveUserPlaidDataService = container[BOTTLE_NAMES.FUNCTION_SAVE_USER_PLAID_DATA];

        return container;
    };

    describe('handler', () => {
        let container;

        describe('when there is some error thrown during execution', () => {
            const someError = new Error('SOMETHING');
            before(() => {
                container = setupTests({
                    [BOTTLE_NAMES.SERVICE_PLAID_AUTHENTICATOR]: {
                        getPlaidAccessToken: simple.stub().rejectWith(someError)
                    }
                });
            });

            it('should log and invoke a failure callback', async () => {
                const result = await util.promisify(saveUserPlaidDataService.handler)(
                    event, context
                );

                expect(result).to.deep.equal(container[BOTTLE_NAMES.LIB_RESPONSE].failure({
                    error: saveUserPlaidDataService.CONSTANTS.FAILURE_MESSAGE
                }));

                expect(container[BOTTLE_NAMES.LIB_LOGGER].createAndLogWrappedErrorStub.lastCall.args).to.deep.equal([
                    saveUserPlaidDataService.CONSTANTS.SAVE_USER_PLAID_DATA_ERROR,
                    saveUserPlaidDataService.CONSTANTS.FAILURE_MESSAGE,
                    someError,
                    { event, context }
                ]);
            });
        });

        describe('when it succeeds', () => {
            before(() => {
                container = setupTests();
            });

            it('should work correctly', async () => {
                const result = await util.promisify(saveUserPlaidDataService.handler)(
                    event, context
                );

                expect(result).to.deep.equal(container[BOTTLE_NAMES.LIB_RESPONSE].success(
                    plaidDataWriteResponse
                ));

                expect(container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER].getHTTPBody.lastCall.args).to.deep.equal([
                    event
                ]);

                expect(container[BOTTLE_NAMES.SERVICE_PLAID_AUTHENTICATOR].getPlaidAccessToken.lastCall.args).to.deep.equal([
                    { plaidPublicToken, plaidAccountId }
                ]);

                expect(container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER].getCognitoIdentityId.lastCall.args).to.deep.equal([
                    event
                ]);

                expect(container[BOTTLE_NAMES.SERVICE_PLAID_DATA].writePlaidData.lastCall.args).to.deep.equal([
                    {
                        userId,
                        plaidAccountData: {
                            plaidAccessToken, plaidPublicToken, plaidAccountId, institutionName
                        }
                    }
                ]);
            });
        });
    });
});
