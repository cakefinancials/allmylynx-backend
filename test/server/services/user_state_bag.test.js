import { expect } from "chai";
import simple from "simple-mock";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../../server/libs/bottle";
import { TEST_ENV_VARS } from "../../init";
const buildTestBottle = testBottleBuilderFactory();

describe("user_state_bag", () => {
    const testUserId = "someUser123";
    const testUserState = { some: "body" };

    let awsClient;
    let s3KeyGeneratorService;
    let userStateBagService;

    const buildUserStateBagTestBottle = (overrides) => {
        const {bottle} = buildTestBottle(overrides);
        awsClient = bottle.container[BOTTLE_NAMES.CLIENT_AWS];
        s3KeyGeneratorService = bottle.container[BOTTLE_NAMES.SERVICE_S3_KEY_GENERATOR];
        userStateBagService = bottle.container[BOTTLE_NAMES.SERVICE_USER_STATE_BAG];
    };

    describe("writeUserState", () => {
        describe("when the save succeeds", () => {
            before(() => {
                buildUserStateBagTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3PutObject: simple.stub().resolveWith('success')
                    }
                });
            });

            it("should return success true", async () => {
                const result = await userStateBagService.writeUserState(testUserId, testUserState);
                expect(result).to.deep.equal({success: true});

                const s3PutObjectStub = awsClient.s3PutObject;
                expect(s3PutObjectStub.callCount).to.equal(1);
                expect(s3PutObjectStub.lastCall.args).to.deep.equal([
                    TEST_ENV_VARS.USER_DATA_BUCKET,
                    s3KeyGeneratorService.getUserStateBagKey(testUserId),
                    JSON.stringify(testUserState)
                ]);
            });
        });

        describe("when the save fails", () => {
            const rejectErr = new Error("S3 PUT FAILURE");

            before(() => {
                buildUserStateBagTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3PutObject: simple.stub().rejectWith(rejectErr)
                    }
                });
            });

            it("should throw the error", async () => {
                const promiseToTest = userStateBagService.writeUserState(testUserId, testUserState);
                const thrownErr = await promiseToTest.catch(e => e);
                expect(thrownErr.nested).to.equal(rejectErr);
                expect(thrownErr.message).to.equal(userStateBagService.CONSTANTS.WRITE_USER_STATE_FAILURE_MESSAGE);
            });
        });
    });

    describe("readUserState", () => {
        const testUserId = "someUser123";
        const testUserStateBag = {some: "bag"};

        describe("when the read succeeds", () => {
            before(() => {
                buildUserStateBagTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3GetObject: simple.stub().resolveWith({
                            Body: JSON.stringify(testUserStateBag)
                        })
                    }
                });
            });

            it("should return the user state bag", async () => {
                const result = await userStateBagService.readUserState(testUserId);
                expect(result).to.deep.equal(testUserStateBag);

                const s3GetObjectStub = awsClient.s3GetObject;
                expect(s3GetObjectStub.callCount).to.equal(1);
                expect(s3GetObjectStub.lastCall.args).to.deep.equal([
                    TEST_ENV_VARS.USER_DATA_BUCKET,
                    s3KeyGeneratorService.getUserStateBagKey(testUserId)
                ]);
            });
        });

        describe("when the read fails for an unknown reason", () => {
            const rejectErr = new Error("S3 GET FAILURE");

            before(() => {
                buildUserStateBagTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3GetObject: simple.stub().rejectWith(rejectErr)
                    }
                });
            });

            it("should throw the error", async () => {
                const promiseToTest = userStateBagService.readUserState(testUserId);
                const thrownErr = await promiseToTest.catch(e => e);
                expect(thrownErr.nested).to.equal(rejectErr);
                expect(thrownErr.message).to.equal(userStateBagService.CONSTANTS.READ_USER_STATE_FAILURE_MESSAGE);
            });
        });

        describe("when the read fails because the key is not found", () => {
            const rejectErr = new Error("S3 GET FAILURE");
            rejectErr.code = "NoSuchKey";

            before(() => {
                buildUserStateBagTestBottle({
                    [BOTTLE_NAMES.CLIENT_AWS]: {
                        s3GetObject: simple.stub().rejectWith(rejectErr)
                    }
                });
            });

            it("should return an empty object", async () => {
                const result = await userStateBagService.readUserState(testUserId);
                expect(result).to.deep.equal({});
            });
        });
    });
});
