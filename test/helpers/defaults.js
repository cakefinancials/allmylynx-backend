import R from 'ramda';

export function getDefaultEvent(overrides = {}) {
  const { body, cognitoIdentityId, cognitoAuthenticationProvider } = R.merge(
    {
      body: {},
      cognitoIdentityId: 'defaultId',
      cognitoAuthenticationProvider: 'cognitoIds:user-sub',
    },
    overrides
  );

  const event = {
    body: JSON.stringify(body),
    requestContext: {
      identity: {
        cognitoIdentityId,
        cognitoAuthenticationProvider,
      },
    },
  };

  return event;
}

export function getDefaultContext() {
  return {};
}
