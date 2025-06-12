const dotenv = require('dotenv')

dotenv.config()

module.exports = async function notarizing(context) {
  // Only run notarization if ENABLE_NOTARIZATION is explicitly set to "true"
  if (process.env.ENABLE_NOTARIZATION !== 'true') {
    console.log('Skipping notarization for this build.')
    return
  }

  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log('Notarization started')
  console.log('App Path:', appPath)
  console.log('Apple ID:', process.env.APPLE_ID)
  console.log('Team ID:', process.env.APPLE_TEAM_ID)
  console.log('App Specific Password is set:', !!process.env.APPLE_APP_SPECIFIC_PASSWORD)

  try {
    const { notarize } = await import('@electron/notarize')

    await notarize({
      tool: 'notarytool',
      appPath,
      appBundleId: 'com.cronus.app',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    })
    console.log('Notarization completed successfully')
  } catch (error) {
    console.error('Notarization failed:', error)
    throw error
  }

  console.log('Notarization complete!')
}
