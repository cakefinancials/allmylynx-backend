import { BOTTLE_NAMES } from "./bottle";

export function BOTTLE_FACTORY(container) {
    const openpgp = container[BOTTLE_NAMES.EXTERN_OPENPGP];

    const SERVICE = {
        encryptText: async (rawText) => {
            const encryptOptions = {
                data: rawText,
                publicKeys: openpgp.key.readArmored(process.env.USER_DATA_PUBLIC_KEY).keys
            };

            const ciphertext = await openpgp.encrypt(encryptOptions);

            return ciphertext.data;
        },
    };

    return SERVICE;
}