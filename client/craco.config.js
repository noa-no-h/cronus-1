const path = require('path');
// const CracoFastRefreshPlugin = require('craco-fast-refresh'); // Temporarily comment out
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');

module.exports = {
  plugins: [
    // { plugin: CracoFastRefreshPlugin } // Temporarily comment out
  ],
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../shared'),
      'react-refresh/runtime.js': path.resolve(
        __dirname,
        '../node_modules/react-refresh/runtime.js'
      ),
      'react-refresh': path.resolve(__dirname, '../node_modules/react-refresh'),
      'react-router': path.resolve(
        __dirname,
        'node_modules/react-router-dom/node_modules/react-router'
      ),
      'html-entities': path.resolve(__dirname, '../node_modules/html-entities'),
    },
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../node_modules'),
        'node_modules',
      ];
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => !(plugin instanceof ModuleScopePlugin)
      );
      webpackConfig.resolve.plugins.push(
        new ModuleScopePlugin(paths.appSrc, [
          paths.appPackageJson,
          path.resolve(__dirname, 'node_modules'),
          path.resolve(__dirname, '../node_modules'),
        ])
      );
      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
  },
};
