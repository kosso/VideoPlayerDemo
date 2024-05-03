// // Learn more https://docs.expo.io/guides/customizing-metro

const { getDefaultConfig } = require("expo/metro-config");
// https://github.com/kristerkari/react-native-svg-transformer?tab=readme-ov-file#step-3-configure-the-react-native-packager
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
    inlineRequires: true
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"]
  };

  return config;
})();
