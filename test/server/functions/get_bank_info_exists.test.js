import { expect } from 'chai';
import simple from 'simple-mock';
import Promise from 'bluebird';

import { handler, CONSTANTS } from '../../../server/functions/get_bank_info_exists';
import { getDefaultEvent, getDefaultContext } from '../../helpers/defaults';

import { BOTTLE_NAMES, testBottleBuilderFactory } from '../../../server/libs/bottle';

describe('get_bank_info_exists', () => {
    const handlerPromise = Promise.promisify(handler);
    const defaultEvent = getDefaultEvent();
    const defaultContext = getDefaultContext();

    let bottle;
    const buildTestBottle = testBottleBuilderFactory();

    describe('when get call returns', () => {
        let success;
        const bankData = { some: 'info' };

        before(() => {
            ({ bottle, success } = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    s3GetObject: simple.stub().resolveWith({ Body: JSON.stringify(bankData) })
                }
            }));
        });

        it('should succeed with exists true', async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(success({ bankData }));
        });
    });

    describe('when get call fails with code "NotFound"', () => {
        let success;

        before(() => {
            ({ bottle, success } = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    s3GetObject: simple.stub().rejectWith({ code: 'NoSuchKey' })
                }
            }));

            success = bottle.container[BOTTLE_NAMES.LIB_RESPONSE].success;
        });

        it('should succeed with exists false', async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(success({ bankData: null }));
        });
    });

    describe('when get call fails with unknown code', () => {
        let failure;

        before(() => {
            ({ bottle, failure } = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    s3GetObject: simple.stub().rejectWith({ code: 'Some Random Code' })
                }
            }));

            failure = bottle.container[BOTTLE_NAMES.LIB_RESPONSE].failure;
        });

        it('should fail with the expected message', async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({ error:CONSTANTS.FAILURE_MESSAGE }));
        });
    });
});
