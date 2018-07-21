export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];

    const SERVICE = {
        getUserStateBagKey: (userId) => {
            const userStateBagKey = `${userId}/user_state_bag.json`;
            return userStateBagKey;
        },

        getUserDashboardDataKey: (userEmail) => {
            const userDashboardDataKey = `${userEmail}/dashboard-data.json`;
            return userDashboardDataKey;
        }

    };

    return SERVICE;
}
