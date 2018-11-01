export function BOTTLE_FACTORY(container) {
  const BOTTLE_NAMES = container.BOTTLE_NAMES;

  const awsLib = container[BOTTLE_NAMES.CLIENT_AWS];
  const envLib = container[BOTTLE_NAMES.CLIENT_ENV];
  const logger = container[BOTTLE_NAMES.LIB_LOGGER].getContextualLogger('service.cognito_helper_service');

  const CONSTANTS = {
    UNRECOGNIZED_IDENTITY_PROVIDER_ERROR: 'UnrecognizedIdentityProviderError',
    UNRECOGNIZED_IDENTITY_PROVIDER_ERROR_MESSAGE: 'Unrecognized identity provider',

    NO_MATCHING_USERS_ERROR: 'NoMatchinUsersError',
    NO_MATCHING_USERS_ERROR_MESSAGE: 'Could not find any matching users',

    COGNITO_LIST_USERS_ERROR: 'CognitoListUsersError',
    COGNITO_LIST_USERS_ERROR_MESSAGE: 'Error while requesting user info from cognito',
  };

  const SERVICE = {
    CONSTANTS,

    getUserEmailFromLambdaEvent: async event => {
      const CAKE_USER_POOL_ID = envLib.getEnvVar('CAKE_USER_POOL_ID');
      const cognitoAuthenticationProvider = event.requestContext.identity.cognitoAuthenticationProvider;
      if (!cognitoAuthenticationProvider.includes(CAKE_USER_POOL_ID)) {
        throw logger.createAndLogWrappedError(
          CONSTANTS.UNRECOGNIZED_IDENTITY_PROVIDER_ERROR,
          CONSTANTS.UNRECOGNIZED_IDENTITY_PROVIDER_ERROR_MESSAGE,
          undefined,
          { cognitoAuthenticationProvider, CAKE_USER_POOL_ID }
        );
      }

      const sub = cognitoAuthenticationProvider
        .split(':')
        .slice(-1)
        .pop();
      const Filter = `sub=\'${sub}\'`;
      const idpParams = {
        UserPoolId: CAKE_USER_POOL_ID,
        AttributesToGet: ['sub', 'email'],
        Filter,
      };

      try {
        const response = await awsLib.cognitoIdentityServiceProviderCall('listUsers', idpParams);
        const users = response['Users'];
        if (users.length === 0) {
          throw logger.createAndLogWrappedError(
            CONSTANTS.NO_MATCHING_USERS_ERROR,
            CONSTANTS.NO_MATCHING_USERS_ERROR_MESSAGE,
            undefined,
            { idpParams }
          );
        }

        const email = users[0]['Attributes'].find(({ Name }) => Name === 'email')['Value'];

        return email;
      } catch (e) {
        throw logger.createAndLogWrappedError(
          CONSTANTS.COGNITO_LIST_USERS_ERROR,
          CONSTANTS.COGNITO_LIST_USERS_ERROR_MESSAGE,
          e,
          { idpParams }
        );
      }
    },
  };

  return SERVICE;
}
