export function getDefaultEvent(cognitoIdentityId = 'defaultId') {
    const event = {
        requestContext: {
            identity: {
                cognitoIdentityId
            }
        }
    };

    return event;
}

export function getDefaultContext() {
    return {};
}