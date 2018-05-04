import { expect } from "chai";
import simple from "simple-mock";
import Promise from "bluebird";

import { handler, CONSTANTS } from "../../functions/get_obfuscated_brokerage_credentials";
import { getDefaultEvent, getDefaultContext } from "../helpers/defaults";

import { BOTTLE_NAMES, buildBottle } from "../../libs/bottle";

describe("get_obfuscated_brokerage_credentials", () => {
    const handlerPromise = Promise.promisify(handler);
    const defaultEvent = getDefaultEvent();
    const defaultContext = getDefaultContext();

    let bottle;

    describe("when s3GetObject call works", () => {
        let success;
        const responseObject = {some: "obfuscated response"};

        before(() => {
            bottle = buildBottle({
                [BOTTLE_NAMES.LIB_AWS]: () => ({
                    s3GetObject: simple.stub().resolveWith({
                        Body: JSON.stringify(responseObject)
                    })
                })
            });

            success = bottle.container[BOTTLE_NAMES.LIB_RESPONSE].success;
        });

        it("should succeed with the correct data returned", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(success(responseObject));
        });
    });

    describe("when s3GetObject call fails", () => {
        let failure;

        before(() => {
            bottle = buildBottle({
                [BOTTLE_NAMES.LIB_AWS]: () => ({
                    s3GetObject: simple.stub().rejectWith("does not matter")
                })
            });

            failure = bottle.container[BOTTLE_NAMES.LIB_RESPONSE].failure;
        });

        it("should fail", async () => {
            const response = await handlerPromise(defaultEvent, defaultContext, bottle.container);
            expect(response).to.deep.equal(failure({error: CONSTANTS.FAILURE_MESSAGE}));
        });
    });
});
