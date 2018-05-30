import { expect } from "chai";
import simple from "simple-mock";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../../server/libs/bottle";
import { TEST_ENV_VARS } from "../../init";
const buildTestBottle = testBottleBuilderFactory();

describe("user_state_bag", () => {
    const testUserId = "someUser123";
    const testUserState = { some: "body" };
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
                const result = await getUserStateBagService().writeUserState(testUserId, testUserState);
                expect(result).to.deep.equal({success: true});

                const s3PutObjectStub = bottle.container[BOTTLE_NAMES.CLIENT_AWS].s3PutObject;
                expect(s3PutObjectStub.callCount).to.equal(1);
                expect(s3PutObjectStub.lastCall.args).to.deep.equal([
                    TEST_ENV_VARS.USER_DATA_BUCKET,
                    bottle.container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR].getUserStateBagKey(testUserId),
                    JSON.stringify(testUserState)
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
                const promiseToTest = getUserStateBagService().writeUserState(testUserId, testUserState);
                const thrownErr = await promiseToTest.catch(e => e);
                expect(thrownErr.nested).to.equal(rejectErr);
            });
        });
    });

    describe("readUserState", () => {
        const testUserId = "someUser123";
        const testUserStateBag = {some: "bag"};

        describe("when the read succeeds", () => {
            before(() => {
                ({bottle} = buildTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3GetObject: simple.stub().resolveWith({
                            Body: JSON.stringify(testUserStateBag)
                        })
                    }
                }));
            });

            it("should return the user state bag", async () => {
                const result = await getUserStateBagService().readUserState(testUserId);
                expect(result).to.deep.equal(testUserStateBag);

                const s3GetObjectStub = bottle.container[BOTTLE_NAMES.CLIENT_AWS].s3GetObject;
                expect(s3GetObjectStub.callCount).to.equal(1);
                expect(s3GetObjectStub.lastCall.args).to.deep.equal([
                    TEST_ENV_VARS.USER_DATA_BUCKET,
                    bottle.container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR].getUserStateBagKey(testUserId)
                ]);
            });
        });

        describe("when the read fails for an unknown reason", () => {
            const rejectErr = new Error("S3 GET FAILURE");

            before(() => {
                ({bottle} = buildTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3GetObject: simple.stub().rejectWith(rejectErr)
                    }
                }));
            });

            it("should throw the error", async () => {
                const promiseToTest = getUserStateBagService().readUserState(testUserId);
                const thrownErr = await promiseToTest.catch(e => e);
                expect(thrownErr.nested).to.equal(rejectErr);
            });
        });

        describe("when the read fails because the key is not found", () => {
            const rejectErr = new Error("S3 GET FAILURE");
            rejectErr.code = "NoSuchKey";

            before(() => {
                ({bottle} = buildTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3GetObject: simple.stub().rejectWith(rejectErr)
                    }
                }));
            });

            it("should return an empty object", async () => {
                const result = await getUserStateBagService().readUserState(testUserId);
                expect(result).to.deep.equal({});
            });
        });
    });
});
