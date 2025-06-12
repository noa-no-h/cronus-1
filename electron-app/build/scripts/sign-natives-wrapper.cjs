const { execSync } = require('child_process')
// const path = require('path')

module.exports = async function beforeBuild(context) {
  // Only run the signing script if ENABLE_NATIVE_SIGNING is explicitly set to "true"
  if (process.env.ENABLE_NATIVE_SIGNING === 'true') {
    console.log('Native module signing is enabled. Starting signing process...')
    try {
      execSync('chmod +x ./build/scripts/sign-natives.sh', { stdio: 'inherit' })
      execSync('./build/scripts/sign-natives.sh', { stdio: 'inherit' })
    } catch (error) {
      console.error('Error executing sign-natives.sh:', error)
      process.exit(1)
    }
  } else {
    console.log('Skipping native module signing for this build.')
  }
}
