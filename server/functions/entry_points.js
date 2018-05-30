import { BOTTLE_NAMES, exportLambdaFunctions } from "../libs/bottle";

module.exports = exportLambdaFunctions([
    [ 'get_user_state_bag', BOTTLE_NAMES.FUNCTION_GET_USER_STATE_BAG ],
    [ 'save_user_state_bag', BOTTLE_NAMES.FUNCTION_SAVE_USER_STATE_BAG ],
]);