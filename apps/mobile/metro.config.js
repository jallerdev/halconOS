const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enablePackageExports = true;

// Force a single physical copy of these packages so Metro never loads two
// instances of React (which would break hooks at runtime — each copy carries
// its own dispatcher). With bun's hoisted linker, these packages get installed
// both at the workspace root and at apps/mobile/node_modules; we redirect any
// lookup to the workspace-root copy.
const SINGLETON_PATHS = {
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  scheduler: path.resolve(workspaceRoot, 'node_modules/scheduler'),
};

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [pkg, target] of Object.entries(SINGLETON_PATHS)) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      const remainder = moduleName.slice(pkg.length);
      const rewritten = target + remainder;
      const resolver = upstreamResolveRequest ?? context.resolveRequest;
      return resolver(
        { ...context, originModulePath: path.join(target, 'package.json') },
        moduleName === pkg ? target : rewritten,
        platform,
      );
    }
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
