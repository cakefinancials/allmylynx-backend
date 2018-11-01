export function BOTTLE_FACTORY(container) {
  const BOTTLE_NAMES = container.BOTTLE_NAMES;
  const R = container[BOTTLE_NAMES.EXTERN_RAMDA];

  const SERVICE = {
    getEnvVar: name => {
      return R.path([name], process.env);
    },
  };

  return SERVICE;
}
