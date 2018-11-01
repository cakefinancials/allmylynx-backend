import { expect } from 'chai';
import simple from 'simple-mock';

import { BOTTLE_NAMES, testBottleBuilderFactory } from '../../../server/libs/bottle';

const buildTestBottle = testBottleBuilderFactory();
const { bottle } = buildTestBottle();
const pgpLib = bottle.container[BOTTLE_NAMES.CLIENT_PGP];

describe('pgp', () => {
  describe('encryptText', () => {
    describe('when we are encrypting a string', () => {
      it('should return a pgp encrypted string', async () => {
        const textToEncrypt = 'asdfasdf';

        const result = (await pgpLib.encryptText(textToEncrypt)).trim();
        expect(result).to.match(/^-----BEGIN PGP MESSAGE-----/);
        expect(result).to.match(/-----END PGP MESSAGE-----$/);
      });
    });
  });
});
