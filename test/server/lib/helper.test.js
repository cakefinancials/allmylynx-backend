import { expect } from "chai";
import simple from "simple-mock";

import { BOTTLE_NAMES, testBottleBuilderFactory } from "../../../server/libs/bottle";

const buildTestBottle = testBottleBuilderFactory();
const {bottle} = buildTestBottle();
const helperLib = bottle.container[BOTTLE_NAMES.LIB_HELPER];

describe("helper", () => {
    describe("obfuscate", () => {
        const tests = [
            {
                str: "asdfasdf",
                charactersToShow: 0,
                expectedResult: "********"
            },
            {
                str: "asdfasdf",
                charactersToShow: -100,
                expectedResult: "********"
            },
            {
                str: "asdfasdf",
                charactersToShow: 100,
                expectedResult: "asdfasdf"
            },
            {
                str: "asdfasdf",
                charactersToShow: 4,
                expectedResult: "****asdf"
            },
        ];

        tests.forEach(({str, charactersToShow, expectedResult}) => {
            describe(`when str is '${str}' and charactersToShow is ${charactersToShow}`, () => {
                it(`should return '${expectedResult}'`, () => {
                    const result = helperLib.obfuscate(str, charactersToShow);
                    expect(result).to.equal(expectedResult);
                });
            });
        });
    });

    describe("executeAllPromises", () => {
        const Promise = bottle.container[BOTTLE_NAMES.EXTERN_BLUEBIRD];

        describe("when there are no promises", () => {
            it("should resolve with no errors and no results", async () => {
                const result = await helperLib.executeAllPromises([]);

                expect(result).to.deep.equal({ errors: [], results: [] });
            })
        });

        describe("when there are some failures and some passes", () => {
            it("should resolve with the appropriate number of errors and results", async () => {
                const result = await helperLib.executeAllPromises([
                    Promise.resolve("success1"),
                    Promise.resolve("success2"),
                    Promise.reject("failure1")
                ]);

                expect(result).to.deep.equal({ errors: ["failure1"], results: ["success1", "success2"] });
            })
        });
    });
});
