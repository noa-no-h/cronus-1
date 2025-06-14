const { execSync } = require('child_process')
const path = require('path')

exports.default = async function (context) {
  const { appOutDir, packager } = context
  const { platform } = packager

  // We only care about macOS signing
  if (platform.name !== 'mac') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)

  const scriptPath = path.join(__dirname, 'post-build-sign.sh')

  console.log(`\n\n[afterSign hook] Running post-build deep signing script for ${appPath}`)

  try {
    // Make sure the script is executable
    execSync(`chmod +x "${scriptPath}"`)

    // Execute the script and pass the app path as an argument
    execSync(`"${scriptPath}" "${appPath}"`, { stdio: 'inherit' })

    console.log('[afterSign hook] Post-build deep signing script finished successfully.\n\n')
  } catch (error) {
    console.error('[afterSign hook] Error executing post-build-sign.sh:', error)
    throw error // Re-throw the error to fail the build
  }
}
