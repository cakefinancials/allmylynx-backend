const execSync = require('child_process').execSync;

// Have to run tests in some order :(
const tests = [
    {
        fnName: "save_user_email_identity_link",
        mock: "save_user_email_identity_link-event.json",
    },
    {
        fnName: "save_brokerage_creds",
        mock: "save_brokerage_credentials-event.json",
    },
    {
        fnName: "save_bank_info",
        mock: "save_bank_info-event.json",
    },
    {
        fnName: "get_bank_info_exists",
        mock: "get_bank_info_exists-event.json",
    },
    {
        fnName: "get_brokerage_creds_exists",
        mock: "get_brokerage_credentials_exists-event.json",
    },
    {
        fnName: "get_obf_bank_info",
        mock: "get_obfuscated_bank_info-event.json",
    },
    {
        fnName: "get_obf_brokerage_creds",
        mock: "get_obfuscated_brokerage_credentials-event.json",
    },
];

tests.forEach(test => {
    const fnName = test.fnName;
    const mock = test.mock;

    try {
        const result = execSync(
            `serverless invoke local --function ${fnName} --path mocks/${mock}`
        );

        console.log(result.toString());
    } catch (e) {
        console.log(e.stdout.toString());
        console.error(e.stderr.toString());

        process.exit(1);
    }
});