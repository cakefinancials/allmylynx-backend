// for some reason, openpgp.key will be undefined unless we use require syntax
const openpgp = require('openpgp');

export async function encryptText(rawText) {
    const encryptOptions = {
        data: rawText,
        publicKeys: openpgp.key.readArmored(process.env.USER_DATA_PUBLIC_KEY).keys
    };

    const ciphertext = await openpgp.encrypt(encryptOptions);

    return ciphertext.data;
}
