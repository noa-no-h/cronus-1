const { execSync } = require('child_process')
// const path = require('path')

module.exports = async function beforeBuild(context) {
  try {
    execSync('chmod +x ./build/scripts/sign-natives.sh', { stdio: 'inherit' })
    execSync('./build/scripts/sign-natives.sh', { stdio: 'inherit' })
  } catch (error) {
    console.error('Error executing sign-natives.sh:', error)
    process.exit(1)
  }
}
