import { expect } from "chai";
import simple from "simple-mock";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../../server/libs/bottle";
const buildTestBottle = testBottleBuilderFactory();

describe("lambda_environment_helper", () => {
    const {bottle} = buildTestBottle();
    const lambdaEnvironmentHelper = bottle.container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER];

    describe("getCognitoIdentityId", () => {
        describe("when the path does not exist", () => {
            it("should return undefined", () => {
                const userId = lambdaEnvironmentHelper.getCognitoIdentityId({some: 'bad request context'});

                expect(userId).to.equal(undefined);
            });
        });

        describe("when the path does", () => {
            it("should return undefined", () => {
                const expectedUserId = "USER-SUB-1234";
                const userId = lambdaEnvironmentHelper.getCognitoIdentityId(
                    {
                        "requestContext": {
                            "identity": {
                                "cognitoIdentityId": expectedUserId
                            }
                        }
                    }
                );

                expect(userId).to.equal(expectedUserId);
            });
        });
    });

    describe("getHTTPBody", () => {
        describe("when there is no body", () => {
            it("should return empty string", () => {
                const httpBody = lambdaEnvironmentHelper.getHTTPBody({body: null});

                expect(httpBody).to.equal('');
            });
        });

        describe("when there is a body", () => {
            it("should return the parsed body", () => {
                const parsedBody = {some: "body"};
                const httpBody = lambdaEnvironmentHelper.getHTTPBody({body: JSON.stringify(parsedBody)});

                expect(httpBody).to.deep.equal(parsedBody);
            });
        });
    });
});
