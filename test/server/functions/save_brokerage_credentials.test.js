import { expect } from 'chai';
import simple from 'simple-mock';
import Promise from 'bluebird';
import R from 'ramda';

import { handler, CONSTANTS } from '../../../server/functions/save_brokerage_credentials';
import { getDefaultEvent, getDefaultContext } from '../../helpers/defaults';
import { TEST_ENV_VARS } from '../../init';

import { BOTTLE_NAMES, testBottleBuilderFactory } from '../../../server/libs/bottle';

describe('save_brokerage_credentials', () => {
  const handlerPromise = Promise.promisify(handler);
  const [username, password, brokerage] = ['un', 'pass', 'brok'];
  const defaultEvent = getDefaultEvent({ body: { username, password, brokerage } });
  const defaultContext = getDefaultContext();

  const successResolveText = 'does not matter';

  const buildTestBottle = testBottleBuilderFactory({
    [BOTTLE_NAMES.CLIENT_AWS]: {
      s3PutObject: simple.stub().resolveWith(successResolveText),
    },
    [BOTTLE_NAMES.CLIENT_PGP]: {
      encryptText: simple.stub().resolveWith(successResolveText),
    },
  });

  describe('when pgp encrypt call fails', () => {
    let bottle, failure;

    before(() => {
      ({ bottle, failure } = buildTestBottle({
        [BOTTLE_NAMES.CLIENT_PGP]: {
          encryptText: simple.stub().rejectWith('some error'),
        },
      }));
    });

    it('should fail with the correct error message', async () => {
      const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
      expect(response).to.deep.equal(failure({ error: CONSTANTS.ENCRYPTING_DATA_FAILURE_MESSAGE }));
    });
  });

  describe('when s3PutObject fails', () => {
    let bottle, failure;

    before(() => {
      ({ bottle, failure } = buildTestBottle({
        [BOTTLE_NAMES.CLIENT_AWS]: {
          s3PutObject: simple.stub().rejectWith('some error'),
        },
      }));
    });

    it('should fail with the correct error message', async () => {
      const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
      expect(response).to.deep.equal(failure({ error: CONSTANTS.S3_UPLOAD_FAILURE_MESSAGE }));
    });
  });

  describe('when all calls succeed', () => {
    let bottle, success;

    before(() => {
      ({ bottle, success } = buildTestBottle());
    });

    it('should respond with success', async () => {
      const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
      expect(response).to.deep.equal(success({ success: true }));

      const [encryptedUpload, obfuscatedUpload] = bottle.container[BOTTLE_NAMES.CLIENT_AWS].s3PutObject.calls;

      const USER_DATA_BUCKET = TEST_ENV_VARS.USER_DATA_BUCKET;

      expect(encryptedUpload.args).to.deep.equal([
        USER_DATA_BUCKET,
        `${defaultEvent.requestContext.identity.cognitoIdentityId}/brokerage_credentials`,
        successResolveText,
      ]);

      expect(obfuscatedUpload.args).to.deep.equal([
        USER_DATA_BUCKET,
        `${defaultEvent.requestContext.identity.cognitoIdentityId}/obfuscated_brokerage_credentials.json`,
        `{"username":"${username}","brokerage":"${brokerage}"}`,
      ]);
    });
  });
});
