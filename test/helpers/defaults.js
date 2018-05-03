import R from "ramda";

export function getDefaultEvent(overrides = {}) {
    const {body, cognitoIdentityId} = R.merge({
        body: {},
        cognitoIdentityId: "defaultId"
    }, overrides);

    const event = {
        body: JSON.stringify(body),
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