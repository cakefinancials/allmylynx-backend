import { BOTTLE_NAMES, wrapLambdaFunction } from "../libs/bottle";

export const CONSTANTS = {
    UNRECOGNIZED_IDENTITY_PROVIDER_FAILURE_MESSAGE: "Unrecognized identity provider",
    NO_MATCHING_USERS_FAILURE_MESSAGE: "Could not find any matching users",
    COGNITO_LIST_USERS_FAILURE_MESSAGE: "Error while requesting user info from cognito",
    SAVE_COGNITO_LINK_FAILURE_MESSAGE: "Error while saving email to cognito id link"
};

export const handler = async function (event, context, container, callback) {
    const awsLib = container[BOTTLE_NAMES.LIB_AWS];
    const envLib = container[BOTTLE_NAMES.LIB_ENV];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];
    const helperLib = container[BOTTLE_NAMES.LIB_HELPER];

    const CAKE_USER_POOL_ID = envLib.getEnvVar("CAKE_USER_POOL_ID");
    const cognitoAuthenticationProvider = event.requestContext.identity.cognitoAuthenticationProvider;
    if (!cognitoAuthenticationProvider.includes(CAKE_USER_POOL_ID)) {
        console.log(CONSTANTS.UNRECOGNIZED_IDENTITY_PROVIDER_FAILURE_MESSAGE);
        console.log(event.requestContext.identity);
        callback(null, responseLib.failure({ error: CONSTANTS.UNRECOGNIZED_IDENTITY_PROVIDER_FAILURE_MESSAGE}));
        return;
    }

    const sub = cognitoAuthenticationProvider.split(":").slice(-1).pop();
    const Filter = `sub=\"${sub}\"`;
    const idpParams = {
        UserPoolId: CAKE_USER_POOL_ID,
        AttributesToGet: [
            "sub",
            "email"
        ],
        Filter
    };

    let email;
    try {
        const response = await awsLib.cognitoIdentityServiceProviderCall("listUsers", idpParams);
        const users = response["Users"];
        if (users.length === 0) {
            console.log(CONSTANTS.NO_MATCHING_USERS_FAILURE_MESSAGE);
            callback(null, responseLib.failure({ error: CONSTANTS.NO_MATCHING_USERS_FAILURE_MESSAGE }));
            return;
        }

        email = (users[0]["Attributes"].find(({Name}) => Name === "email"))["Value"];
    } catch (e) {
        console.log(e);
        callback(null, responseLib.failure({ error: CONSTANTS.COGNITO_LIST_USERS_FAILURE_MESSAGE }));
        return;
    }

    const cognitoId = event.requestContext.identity.cognitoIdentityId;

    const userEmailIdentityLink = `email_to_cognito_id/${email}/${cognitoId}`;

    const USER_DATA_BUCKET = envLib.getEnvVar("USER_DATA_BUCKET");
    const createLinkPromise = awsLib.s3PutObject(
        USER_DATA_BUCKET,
        userEmailIdentityLink,
        ""
    );

    const results = await helperLib.executeAllPromises([createLinkPromise]);

    if (results.errors.length > 0) {
        console.log(CONSTANTS.SAVE_COGNITO_LINK_FAILURE_MESSAGE, {errors: results.errors});
        callback(null, responseLib.failure({ error: CONSTANTS.SAVE_COGNITO_LINK_FAILURE_MESSAGE }));
    } else {
        callback(null, responseLib.success({ success: true }));
    }
}

export const main = wrapLambdaFunction(handler);