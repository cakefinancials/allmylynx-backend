export function BOTTLE_FACTORY(container) {
  const BOTTLE_NAMES = container.BOTTLE_NAMES;

  const SERVICE = {
    getUserStateBagKey: userId => {
      const userStateBagKey = `${userId}/user_state_bag.json`;
      return userStateBagKey;
    },

    getUserDashboardDataKey: userEmail => {
      const userDashboardDataKey = `${userEmail}/dashboard-data.json`;
      return userDashboardDataKey;
    },

    getUserPlaidDataKey: userId => {
      const userDashboardDataKey = `${userId}/user_plaid_data.json`;
      return userDashboardDataKey;
    },
  };

  return SERVICE;
}
