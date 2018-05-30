import { expect } from "chai";
import simple from "simple-mock";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../../server/libs/bottle";
import { getDefaultEvent } from "../../helpers/defaults";
import { TEST_ENV_VARS } from "../../init";
const buildTestBottle = testBottleBuilderFactory();

describe("user_state_bag", () => {
    const defaultBody = { some: "body" };
    const defaultCognitoIdentityId = "someUser123";
    let bottle;

    const getUserStateBagService = () => bottle.container[BOTTLE_NAMES.SERVICE_USER_STATE_BAG];

    describe("writeUserState", () => {
        describe("when the save succeeds", () => {
            before(() => {
                ({bottle} = buildTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3PutObject: simple.stub().resolveWith('success')
                    }
                }));
            });

            it("should return success true", async () => {
                const lambdaEvent = getDefaultEvent({body: defaultBody, cognitoIdentityId: defaultCognitoIdentityId});

                const result = await getUserStateBagService().writeUserState(lambdaEvent);
                expect(result).to.deep.equal({success: true});

                const s3PutObjectStub = bottle.container[BOTTLE_NAMES.CLIENT_AWS].s3PutObject
                expect(s3PutObjectStub.callCount).to.equal(1);
                expect(s3PutObjectStub.lastCall.args).to.deep.equal([
                    TEST_ENV_VARS.USER_DATA_BUCKET,
                    bottle.container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR].getUserStateBagKey(defaultCognitoIdentityId),
                    JSON.stringify(defaultBody)
                ]);
            });
        });

        describe("when the save fails", () => {
            const rejectErr = new Error("S3 PUT FAILURE");

            before(() => {
                ({bottle} = buildTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3PutObject: simple.stub().rejectWith(rejectErr)
                    }
                }));
            });

            it("should throw the error", async () => {
                const lambdaEvent = getDefaultEvent();

                let thrownErr = undefined;
                try {
                    await getUserStateBagService().writeUserState(lambdaEvent);
                } catch (err) {
                    thrownErr = err;
                }

                expect(thrownErr.nested).to.equal(rejectErr);
            });
        });
    });
});
