import { BOTTLE_NAMES } from "./bottle";

export function BOTTLE_FACTORY(container) {
    const R = container[BOTTLE_NAMES.EXTERN_RAMDA];

    const SERVICE = {
        getEnvVar: (name) => {
            return R.path([name], process.env);
        }
    };

    return SERVICE;
}
