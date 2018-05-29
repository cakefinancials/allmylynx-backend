export function BOTTLE_FACTORY(container) {
    const BOTTLE_NAMES = container.BOTTLE_NAMES;
    const envLib = container[BOTTLE_NAMES.CLIENT_ENV];

    const SERVICE = {
        getUserStateBagKey: (userId) => {
            const userStateBagKey = `user_state_bag/${userId}.json`;
            return userStateBagKey;
        }
    };

    return SERVICE;
}
