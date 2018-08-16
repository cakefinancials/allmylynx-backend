import { BOTTLE_NAMES, exportLambdaFunctions } from '../libs/bottle';

module.exports = exportLambdaFunctions([
    [ 'get_user_state_bag', BOTTLE_NAMES.FUNCTION_GET_USER_STATE_BAG ],
    [ 'get_user_dashboard_data', BOTTLE_NAMES.FUNCTION_GET_USER_DASHBOARD_DATA ],
    [ 'save_user_state_bag', BOTTLE_NAMES.FUNCTION_SAVE_USER_STATE_BAG ],
    [ 'save_user_plaid_data', BOTTLE_NAMES.FUNCTION_SAVE_USER_PLAID_DATA ],
]);