import { success, failure } from "./libs/response-lib";
import * as awsLib from "./libs/aws-lib";
import { executeAllPromises } from "./libs/helper-lib";

export async function main(event, context, callback) {
    const userPoolId = process.env.CAKE_USER_POOL_ID;
    const cognitoAuthenticationProvider = event.requestContext.identity.cognitoAuthenticationProvider;
    if (!cognitoAuthenticationProvider.includes(userPoolId)) {
        console.log('Unrecognized identity provider');
        console.log(event.requestContext.identity);
        callback(null, failure({ reason: 'Unrecognized identity provider'}));
        return;
    }

    const sub = cognitoAuthenticationProvider.split(':').slice(-1).pop();
    const Filter = `sub=\"${sub}\"`;
    const idpParams = {
        UserPoolId: userPoolId,
        AttributesToGet: [
            'sub',
            'email'
        ],
        Filter
    };

    let email;
    try {
        const response = await awsLib.cognitoIdentityServiceProviderCall('listUsers', idpParams);
        const users = response['Users'];
        if (users.length === 0) {
            console.log('Could not find any matching users');
            callback(null, failure({ reason: 'Could not find any matching users' }));
            return;
        }

        email = (users[0]['Attributes'].find(({Name}) => Name === 'email'))['Value'];
    } catch (e) {
        console.log(e);
        callback(null, failure({ reason: 'Error while requesting user info from cognito' }));
        return;
    }

    const cognitoId = event.requestContext.identity.cognitoIdentityId;

    const userEmailIdentityLink = `email_to_cognito_id/${email}/${cognitoId}`;

    const createLinkPromise = awsLib.s3PutObject(
        process.env.USER_DATA_BUCKET,
        userEmailIdentityLink,
        ''
    );

    const results = await executeAllPromises([createLinkPromise]);

    if (results.errors.length > 0) {
        console.log('Error while saving email to cognito id link', {errors: results.errors});
        callback(null, failure({ error: 'Error while saving email to cognito id link' }));
    } else {
        callback(null, success({ success: true }));
    }
}