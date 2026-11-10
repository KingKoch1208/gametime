// Metro config. Native builds use the defaults; the web build (the shareable
// browser preview) swaps in two small shims from ./web:
//  - react-native-maps → an illustrated Athens map (real map tiles can't load there)
//  - expo-router's entry/history → always start at "/" and keep history in memory,
//    because the preview runs inside a sandboxed frame we don't control.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const resolve = config.resolver.resolveRequest;
const file = (p) => ({ type: 'sourceFile', filePath: path.join(__dirname, p) });

config.resolver.resolveRequest = (ctx, name, platform) => {
  if (platform === 'web') {
    if (name === 'react-native-maps') return file('web/react-native-maps.tsx');
    if (name === 'expo-router/build/qualified-entry') return file('web/qualified-entry.tsx');
    if (name.endsWith('global-state/browserHistoryAdapter') && ctx.originModulePath.includes(path.join('expo-router', 'build'))) {
      return { type: 'sourceFile', filePath: require.resolve('expo-router/build/global-state/browserHistoryAdapter.native.js') };
    }
  }
  return resolve ? resolve(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
};

module.exports = config;
