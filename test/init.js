import R from "ramda";

import { setDefaultBottleOverrides, BOTTLE_NAMES } from "../server/libs/bottle";

const testPublicKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: BCPG C# v1.6.1.0

mQENBFrsuFgBCACHGfqQyIm46lAem1GOEiGRI6tlXsVS3CzkzBXSh3M5/KOxjS6i
jtRoPthWA1WJEZuGub2abtzBc2flIRVPJdK24iy04qOOx7kX1NpSMcqZsJjewB5U
3G+jFJa01gTcOwgKNncJOxS9Mh7p0q2wX1KIYH/ek7Zb8y/s7oJKKuJbaJiWj/z1
9QCa+RW/rzgOTXyO7IIaboDJz2tcuBzbdFZUpHT0j9f0Kba0Me3v71Mv2XckpEgo
T6dFrNuQeaz6OCilYeqAMDCXyP1mCUqOziJYQj9Pkn07uezGjAojfN2SgZ9tHHau
SsUekuWCoh7F8am/nkvq0gEeoKgdGRF11tcnABEBAAG0AIkBHAQQAQIABgUCWuy4
WAAKCRDVvvRo7yHzNvZ2B/9oJxMBKcx+rM5eSN587E4BXVmUsRwCfrJ7VpFcaYyb
WthZQ3E7lPKCkBT0aNkWORF7abYBiyIfOx/+sNif7Th+D8+Xz8TdwdQDUctz4zq0
BCdkOwN7m9/cwsLIeerkIyM+LaGf0TgCangN8kg7A3+k77gp7TF/XWnF8zckDPf7
i46vTnVLxLyyh/LwkcF4XOGyVvzvMdj09oyMes/LAwJXbxG+/owOMieRrntegjUc
edrNlfZx0U2uVhaU7DThvSDCAq7nmFHuFGAigO6uM+b8QPB4M0zxrcvKtWO4jwvU
7lZaPKcIFZw7ZW9CrKDE3z3DV/9oHENAVE2PzsGEFZaa
=QZhr
-----END PGP PUBLIC KEY BLOCK-----
`;

export const TEST_ENV_VARS = {
    AWS_SDK_REGION: "us-east-2",
    CAKE_USER_POOL_ID: "SOME_FAKE_USER_POOL_ID",
    USER_DATA_BUCKET: "SOME_FAKE_BUCKET",
    USER_DATA_PUBLIC_KEY: testPublicKey,
};

setDefaultBottleOverrides({
    [BOTTLE_NAMES.CLIENT_ENV]: () => ({
        getEnvVar: (name) => {
            const envVar = R.path([name], TEST_ENV_VARS);

            return envVar;
        }
    }),
    [BOTTLE_NAMES.EXTERN_ROLLBAR]: () => {
        return function TestRollbar(config) {
            const rollbarFns = [
                "log",
                "debug",
                "info",
                "warning",
                "error",
                "critical",
            ];

            R.forEach((fnName) => {
                this[fnName] = () => {}
            }, rollbarFns);

            this.lambdaHandler = (fn) => {
                return fn;
            }
        }

        return TestRollbar;
    }
});
