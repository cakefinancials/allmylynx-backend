/**
 * This service will help us parse the lambda event and context for useful info
 */
export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const R = container[BOTTLE_NAMES.EXTERN_RAMDA];

    const SERVICE = {
        getCognitoIdentityId: (lambdaEvent) => {
            const userId = R.path([ 'requestContext', 'identity', 'cognitoIdentityId' ], lambdaEvent);

            return userId;
        },

        getHTTPBody: (lambdaEvent) => {
            const data = lambdaEvent.body ? JSON.parse(lambdaEvent.body) : '';

            return data;
        }
    };

    return SERVICE;
}
