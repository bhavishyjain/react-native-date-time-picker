const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const workspaceSrc = path.resolve(workspaceRoot, 'src');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceSrc];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules/react-native/node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  '@react-native/virtualized-lists': path.resolve(
    projectRoot,
    'node_modules/react-native/node_modules/@react-native/virtualized-lists',
  ),
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-gesture-handler': path.resolve(
    projectRoot,
    'node_modules/react-native-gesture-handler',
  ),
  'react-native-reanimated': path.resolve(
    projectRoot,
    'node_modules/react-native-reanimated',
  ),
  'react-native-safe-area-context': path.resolve(
    projectRoot,
    'node_modules/react-native-safe-area-context',
  ),
};

module.exports = config;
