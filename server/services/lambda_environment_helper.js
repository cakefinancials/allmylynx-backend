/**
 * This service will help us parse the lambda event and context for useful info
 */
export function BOTTLE_FACTORY(container) {
    const SERVICE = {
        getCognitoIdentityId: (lambdaEvent) => {
            const userId = lambdaEvent.requestContext.identity.cognitoIdentityId;

            return userId;
        },

        getHTTPBody: (lambdaEvent) => {
            const data = JSON.parse(lambdaEvent.body);

            return data;
        }
    };

    return SERVICE;
}
