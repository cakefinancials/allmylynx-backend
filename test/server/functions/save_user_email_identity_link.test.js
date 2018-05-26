import { expect } from "chai";
import simple from "simple-mock";
import Promise from "bluebird";
import R from "ramda";

import { handler, CONSTANTS } from "../../../server/functions/save_user_email_identity_link";
import { getDefaultEvent, getDefaultContext } from "../../helpers/defaults";
import { TEST_ENV_VARS } from "../../init";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../../server/libs/bottle";

describe("save_user_email_identity_link", () => {
    const handlerPromise = Promise.promisify(handler);
    const email = "user@email.com";
    const sub = "user-sub";

    const defaultEvent = getDefaultEvent({
        cognitoAuthenticationProvider: `${TEST_ENV_VARS.CAKE_USER_POOL_ID}:${sub}`,
    });
    const defaultContext = getDefaultContext();

    const successResolveText = "does not matter";

    const buildTestBottle = testBottleBuilderFactory({
        [BOTTLE_NAMES.CLIENT_AWS]: {
            cognitoIdentityServiceProviderCall: simple.stub().resolveWith({
                Users: [{Attributes: [{Name: "email", Value: email}]}]
            }),
            s3PutObject: simple.stub().resolveWith(successResolveText),
        },
        [BOTTLE_NAMES.CLIENT_PGP]: {
            encryptText: simple.stub().resolveWith(successResolveText)
        }
    });

    describe("when the provided does not contain the user pool id", () => {
        let bottle, failure;
        const event = getDefaultEvent({
            cognitoAuthenticationProvider: "some-nonsense:provider",
        });
        before(() => {
            ({bottle, failure} = buildTestBottle());
        });

        it("should fail with the correct error message", async () => {
            const response = await handlerPromise(event, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.UNRECOGNIZED_IDENTITY_PROVIDER_FAILURE_MESSAGE}));
        });
    });

    describe("when there is no user found", () => {
        let bottle, failure;

        before(() => {
            ({bottle, failure} = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    cognitoIdentityServiceProviderCall: simple.stub().resolveWith({
                        Users: []
                    })
                }
            }));
        });

        it("should fail with the correct error message", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.NO_MATCHING_USERS_FAILURE_MESSAGE}));
        });
    });

    describe("when the call to cognitoIdentityServiceProviderCall fails", () => {
        let bottle, failure;

        before(() => {
            ({bottle, failure} = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    cognitoIdentityServiceProviderCall: simple.stub().rejectWith("does not matter")
                }
            }));
        });

        it("should fail with the correct error message", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.COGNITO_LIST_USERS_FAILURE_MESSAGE}));
        });
    });

    describe("when the call to s3PutObject fails", () => {
        let bottle, failure;

        before(() => {
            ({bottle, failure} = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    s3PutObject: simple.stub().rejectWith("does not matter")
                }
            }));
        });

        it("should fail with the correct error message", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.SAVE_COGNITO_LINK_FAILURE_MESSAGE}));
        });
    });

    describe("when all calls succeed", () => {
        let bottle, success;

        before(() => {
            ({bottle, success} = buildTestBottle());
        });

        it("should succeed", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(success({success: true}));


            const [emailLinkUpload] = bottle.container[BOTTLE_NAMES.CLIENT_AWS].s3PutObject.calls;

            expect(emailLinkUpload.args).to.deep.equal([
                TEST_ENV_VARS.USER_DATA_BUCKET,
                `email_to_cognito_id/${email}/${defaultEvent.requestContext.identity.cognitoIdentityId}`,
                ""
            ]);
        });
    });
});
