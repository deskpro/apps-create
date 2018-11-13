const createJestConfig = require('../scripts/utils/createJestConfig');

module.exports = (resolve, rootDir, isEjecting) => {
  const config = createJestConfig(resolve, rootDir, isEjecting);
  config.testMatch.push(
    '<rootDir>/test/**/?(*.)(spec|test).{js,jsx,mjs}',
    '<rootDir>/test/**/?(*.)(spec|test).{js,jsx,mjs}'
  );

  // see https://jestjs.io/docs/en/tutorial-react-native#transformignorepatterns-customization
  // we're overriding the default transformIgnorePatterns regex with one that allows some packages
  // to extend this regex for other packages that need transpiling replace `date-fns` with:
  // date-fns|<name-of-package>
  config.transformIgnorePatterns = [
    '[/\\\\]node_modules[/\\\\](?!(date-fns)[/\\\\]).+\\.(js|jsx|mjs)$',
  ];
  return config;
};
