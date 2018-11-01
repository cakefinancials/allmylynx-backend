import { expect } from 'chai';
import simple from 'simple-mock';
import * as R from 'ramda';

import { BOTTLE_NAMES, testBottleBuilderFactory } from '../../../server/libs/bottle';
const buildTestBottle = testBottleBuilderFactory();

describe('plaid_data_service_test', () => {
  let plaidDataService;
  const TEST_USER_DATA_BUCKET = 'test-data-bucket';
  const testUserPlaidDataKey = 'test-user-plaid-data-key';

  const setupTests = (overrides = {}) => {
    const {
      bottle: { container },
    } = buildTestBottle(
      R.merge(
        {
          [BOTTLE_NAMES.CLIENT_ENV]: { getEnvVar: () => TEST_USER_DATA_BUCKET },
          [BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR]: {
            getUserPlaidDataKey: () => testUserPlaidDataKey,
          },
        },
        overrides
      )
    );

    return container[BOTTLE_NAMES.SERVICE_PLAID_DATA];
  };

  const userId = 'some_user_id';
  const plaidAccountData = { some: 'plaid data' };

  describe('writePlaidData', () => {
    describe('when the s3 put fails', () => {
      before(() => {
        plaidDataService = setupTests({
          [BOTTLE_NAMES.CLIENT_AWS]: {
            s3PutObject: simple.stub().rejectWith('SOMETHING'),
          },
        });
      });

      it('should throw and log', async () => {
        const err = await plaidDataService
          .writePlaidData({
            userId,
            plaidAccountData,
          })
          .then(() => undefined, e => e);

        expect(err.name).to.equal(plaidDataService.CONSTANTS.WRITE_PLAID_DATA_ERROR);
      });
    });

    describe('when the s3 put succeeds', () => {
      const awsClientMock = { s3PutObject: simple.stub().resolveWith('SOMETHING') };
      before(() => {
        plaidDataService = setupTests({
          [BOTTLE_NAMES.CLIENT_AWS]: awsClientMock,
        });
      });

      it('should work correctly', async () => {
        const result = await plaidDataService.writePlaidData({
          userId,
          plaidAccountData,
        });

        expect(result).to.deep.equal({ success: true });
        expect(awsClientMock.s3PutObject.lastCall.args).to.deep.equal([
          TEST_USER_DATA_BUCKET,
          testUserPlaidDataKey,
          JSON.stringify(plaidAccountData),
        ]);
      });
    });
  });
});
