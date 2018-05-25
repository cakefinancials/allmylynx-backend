import { expect } from "chai";
import simple from "simple-mock";
import Promise from "bluebird";

import { handler, CONSTANTS } from "../../functions/get_obfuscated_bank_info";
import { getDefaultEvent, getDefaultContext } from "../helpers/defaults";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../libs/bottle";

describe("get_obfuscated_bank_info", () => {
    const handlerPromise = Promise.promisify(handler);
    const defaultEvent = getDefaultEvent();
    const defaultContext = getDefaultContext();

    let bottle;
    const buildTestBottle = testBottleBuilderFactory();

    describe("when s3GetObject call works", () => {
        let success;
        const responseObject = {some: "obfuscated response"};

        before(() => {
            ({bottle, success} = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    s3GetObject: simple.stub().resolveWith({
                        Body: JSON.stringify(responseObject)
                    })
                }
            }));
        });

        it("should succeed with the correct data returned", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(success(responseObject));
        });
    });

    describe("when s3GetObject call fails", () => {
        let failure;

        before(() => {
            ({bottle, failure} = buildTestBottle({
                [BOTTLE_NAMES.CLIENT_AWS]: {
                    s3GetObject: simple.stub().rejectWith("does not matter")
                }
            }));
        });

        it("should fail", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.FAILURE_MESSAGE}));
        });
    });
});
