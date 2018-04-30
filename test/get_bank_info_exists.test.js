import { expect } from "chai";
import simple from "simple-mock";
import Promise from "bluebird";

import { main, CONSTANTS } from "../get_bank_info_exists";
import { getDefaultEvent, getDefaultContext } from "./helpers/defaults";
import * as awsLib from "../libs/aws";
import { success, failure } from "../libs/response";

describe("get_bank_info_exists", () => {
    const mainPromise = Promise.promisify(main);

    afterEach(() => {
        simple.restore();
    });

    describe("when HEAD call returns", () => {
        const event = getDefaultEvent();
        const context = getDefaultContext();

        before(() => {
            simple.mock(awsLib, "s3HeadObject").resolveWith("does not matter");
        });

        it("should succeed with exists true", async () => {
            const response = await mainPromise(event, context);
            expect(response).to.deep.equal(success({exists:true}));
        });
    });

    describe("when HEAD call fails with code 'NotFound'", () => {
        const event = getDefaultEvent();
        const context = getDefaultContext();

        before(() => {
            simple.mock(awsLib, "s3HeadObject").rejectWith({code: "NotFound"});
        });

        it("should succeed with exists false", async () => {
            const response = await mainPromise(event, context);
            expect(response).to.deep.equal(success({exists:false}));
        });
    });

    describe("when HEAD call fails with unknown code", () => {
        const event = getDefaultEvent();
        const context = getDefaultContext();

        before(() => {
            simple.mock(awsLib, "s3HeadObject").rejectWith({code: "Some Random Code"});
        });

        it("should fail with the expected message", async () => {
            const response = await mainPromise(event, context);
            expect(response).to.deep.equal(failure({error:CONSTANTS.FAILURE_MESSAGE}));
        });
    });
});