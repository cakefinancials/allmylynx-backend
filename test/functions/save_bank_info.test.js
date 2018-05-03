import { expect } from "chai";
import simple from "simple-mock";
import Promise from "bluebird";
import R from "ramda";

import { handler, CONSTANTS } from "../../functions/save_bank_info";
import { getDefaultEvent, getDefaultContext } from "../helpers/defaults";

import { BOTTLE_NAMES, buildBottle } from "../../libs/bottle";

describe("save_bank_info", () => {
    const handlerPromise = Promise.promisify(handler);
    const [routingNumber, accountNumber] = ["123123123", "321321321"];
    const defaultEvent = getDefaultEvent({body: {routingNumber, accountNumber}});
    const defaultContext = getDefaultContext();

    const successResolveText = "does not matter";

    const buildTestBottle = (overrides) => {
        const bottle = buildBottle(
            R.merge({
                [BOTTLE_NAMES.LIB_AWS]: () => ({
                    "s3PutObject": simple.stub().resolveWith(successResolveText)
                }),
                [BOTTLE_NAMES.LIB_PGP]: () => ({
                    "encryptText": simple.stub().resolveWith(successResolveText)
                })
            }, overrides)
        );

        const { success, failure } = bottle.container[BOTTLE_NAMES.LIB_RESPONSE];

        return {
            bottle,
            success,
            failure
        };
    };

    describe("when pgp encrypt call fails", () => {
        let bottle, failure;

        before(() => {
            ({bottle, failure} = buildTestBottle({
                [BOTTLE_NAMES.LIB_PGP]: () => ({
                    "encryptText": simple.stub().rejectWith("some error")
                })
            }));
        });

        it("should fail with the correct error message", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.ENCRYPTING_DATA_FAILURE_MESSAGE}));
        });
    });

    describe("when s3PutObject fails", () => {
        let bottle, failure;

        before(() => {
            ({bottle, failure} = buildTestBottle({
                [BOTTLE_NAMES.LIB_AWS]: () => ({
                    "s3PutObject": simple.stub().rejectWith("some error")
                })
            }));
        });

        it("should fail with the correct error message", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.S3_UPLOAD_FAILURE_MESSAGE}));
        });
    });

    describe("when all calls succeed", () => {
        let bottle, success;

        before(() => {
            ({bottle, success} = buildTestBottle());
        });

        it("should respond with success", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(success({success: true}));

            const [encryptedUpload, obfuscatedUpload] =
                bottle.container[BOTTLE_NAMES.LIB_AWS].s3PutObject.calls;

            const USER_DATA_BUCKET = bottle.container[BOTTLE_NAMES.LIB_ENV].getEnvVar("USER_DATA_BUCKET");

            expect(encryptedUpload.args).to.deep.equal([
                USER_DATA_BUCKET,
                `${defaultEvent.requestContext.identity.cognitoIdentityId}/bank_info`,
                successResolveText
            ]);

            expect(obfuscatedUpload.args).to.deep.equal([
                USER_DATA_BUCKET,
                `${defaultEvent.requestContext.identity.cognitoIdentityId}/obfuscated_bank_info.json`,
                "{\"routingNumber\":\"*****3123\",\"accountNumber\":\"*****1321\"}"
            ]);
        });
    });
});
