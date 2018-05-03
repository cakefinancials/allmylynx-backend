import R from "ramda";

import { setDefaultBottleOverrides, BOTTLE_NAMES } from "../libs/bottle";

const TEST_ENV_VARS = {
    USER_DATA_BUCKET: "SOME_FAKE_BUCKET",
    USER_DATA_PUBLIC_KEY: "SOME_FAKE_PUBLIC_KEY",
    CAKE_USER_POOL_ID: "SOME_FAKE_USER_POOL_ID",
};

setDefaultBottleOverrides({
    [BOTTLE_NAMES.LIB_ENV]: () => ({
        getEnvVar: (name) => {
            const envVar = R.path([name], TEST_ENV_VARS);

            return envVar;
        }
    })
});
