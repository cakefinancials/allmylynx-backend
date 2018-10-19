export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;

    const axios = container[BOTTLE_NAMES.EXTERN_AXIOS];
    const lambdaEnvironmentHelper = container[BOTTLE_NAMES.SERVICE_LAMBDA_ENVIRONMENT_HELPER];
    const responseLib = container[BOTTLE_NAMES.LIB_RESPONSE];

    const getZapierWebhookURL = (zapierWebhookId) => `https://hooks.zapier.com/hooks/catch/${zapierWebhookId}/`;

    const SERVICE = {
        handler: async (event, context, callback) => {
            const { zapierWebhookId, zapierPostBody } = lambdaEnvironmentHelper.getHTTPBody(event);

            const result = await axios.post(getZapierWebhookURL(zapierWebhookId), zapierPostBody || {});

            callback(null, responseLib.success(result.data));
        }
    };

    return SERVICE;
}
