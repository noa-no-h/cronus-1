const fs = require('fs')
const yaml = require('js-yaml')

// Load the base YAML configuration
const baseConfig = yaml.load(fs.readFileSync('electron-builder.yml', 'utf8'))

// Define overrides for development
const devConfig = {
  ...baseConfig,
  appId: 'com.cronus.app.dev',
  productName: 'Cronus (Dev)'
  // You can add other development-specific overrides here
}

module.exports = devConfig
