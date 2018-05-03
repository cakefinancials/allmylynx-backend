import { BOTTLE_NAMES } from "./bottle";

export function BOTTLE_FACTORY(container) {
    const envLib = container[BOTTLE_NAMES.LIB_ENV];
    const openpgp = container[BOTTLE_NAMES.EXTERN_OPENPGP];

    const SERVICE = {
        encryptText: async (rawText) => {
            const USER_DATA_PUBLIC_KEY = envLib.getEnvVar("USER_DATA_PUBLIC_KEY");

            const encryptOptions = {
                data: rawText,
                publicKeys: openpgp.key.readArmored(USER_DATA_PUBLIC_KEY).keys
            };

            const ciphertext = await openpgp.encrypt(encryptOptions);

            return ciphertext.data;
        },
    };

    return SERVICE;
}