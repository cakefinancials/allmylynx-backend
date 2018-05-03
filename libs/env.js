import R from "ramda";

import { BOTTLE_NAMES } from "./bottle";

export function BOTTLE_FACTORY(container) {
    const SERVICE = {
        getEnvVar: (name) => {
            return R.path([name], process.env);
        }
    };

    return SERVICE;
}
