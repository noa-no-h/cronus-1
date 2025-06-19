# electron-app

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ bun install
```

### Development

```bash
$ bun run dev
```

### Build

```bash
# For macOS
$ bun run build:mac:open:signed

## Project Structure Overview

```

electron-app/
├── out/ # Build output (Main, Preload, Renderer JS files)
├── resources/ # Static assets (e.g., icons)
├── src/
│ ├── main/ # Main process source (Node.js environment)
│ │ └── index.ts
│ ├── preload/ # Preload script source
│ │ ├── index.ts
│ │ └── index.d.ts # Type definitions for preload API
│ ├── renderer/ # Renderer process source (React UI)
│ │ ├── src/
│ │ │ ├── App.tsx
│ │ │ ├── main.tsx # React entry point
│ │ │ ├── env.d.ts # Renderer environment types
│ │ │ └── components/ # UI components (example)
│ │ └── index.html # HTML entry for renderer
│ └── native-modules/ # Native Node.js addons
│ └── native-windows/ # Example native module
│ ├── macos/ # macOS specific native code
│ │ ├── activeWindowObserver.h
│ │ ├── activeWindowObserver.mm
│ │ └── nativeWindows.mm
│ ├── binding.gyp # node-gyp build configuration
│ ├── index.ts # TypeScript wrapper for native module
│ └── package.json # for the native module
├── .eslintrc.js (or .mjs, eslint.config.mjs) # ESLint configuration
├── .gitignore
├── package.json
├── tsconfig.json # Base TypeScript configuration (if present)
├── tsconfig.node.json # TypeScript config for main/preload
├── tsconfig.web.json # TypeScript config for renderer
└── README.md

## Building the Electron App

The primary method for creating local builds is through `electron-builder`, which ensures that all packaging, code signing, and entitlements are handled correctly and consistently.

### Local Production Build (for Testing)

To create a full, signed production-ready build on your local machine (including a `.dmg` installer) without publishing it, run:

```bash
bun run build:mac:electron-builder
```

This command is the recommended way to create a local build for testing and verification. It builds, signs, and packages the application, producing a `.dmg` file in the `dist/` directory.

### Development Utility Scripts

**Full Installation Cleanup**

If you need to reset your local environment, you can use the cleanup script. This is useful when debugging permissions or first-launch issues.

```bash
bun run clean:cronus-installation
```

This script will:

- Delete `Cronus.app` from your `/Applications` folder.
- Reset macOS permissions (TCC) for Apple Events and Accessibility for the app.

## Over-the-air (OTA) updates via S3

Cronus delivers automatic updates from the public S3 bucket `cronusnewupdates` (region `us-east-1`). Every packaged copy of the app checks this bucket on startup and whenever the user clicks _Settings → Check for Updates_.

### 1 – AWS Credentials Setup (Prerequisites)

Publishing the application to S3 requires valid AWS credentials with permission to upload to the `cronusnewupdates` bucket.

**Important:** `electron-builder` reliably uses the shared AWS credentials file (`~/.aws/credentials`) and ignores credentials set via environment variables (Bug?). Therefore, the only supported method is to configure your global AWS credentials file.

1.  **Locate or Create the Credentials File:**
    The file is located at `~/.aws/credentials` on both macOS and Linux. If it doesn't exist, you'll need to create it.

2.  **Add a `[default]` Profile:**
    Open the file and add your AWS Access Key ID and Secret Access Key under a profile named `[default]`. It should look exactly like this:

    ```ini
    [default]
    aws_access_key_id = YOUR_ACCESS_KEY_HERE
    aws_secret_access_key = YOUR_SECRET_KEY_HERE
    ```

3.  **Configure the AWS Region (Recommended):**
    You can also set a default region in `~/.aws/config`. If the file doesn't exist, create it at `~/.aws/config`:

    ```ini
    [default]
    region = us-east-1
    ```

`electron-builder` will automatically detect and use these credentials during the publish step.

### 2 – Release workflow

1.  **Bump the version** in `electron-app/package.json` (e.g. `"1.0.8" → "1.0.9"`).
2.  **Build, publish, and update download links:**
    Run the all-in-one script from within the `electron-app` directory:
    ```bash
    bun run publish:with-links
    ```
    This single command handles the entire release process:
    - Builds the application.
    - Packages the `.dmg` and `.zip` files.
    - Publishes the new version and its `latest-mac.yml` file to S3.
    - Updates the `Cronus-latest.dmg` and `Cronus-latest.zip` files in S3 to point to the new version.

If you just need to create a local build for testing without uploading, use `bun run build:for-publish`.

### 3 – Permanent Download Links

The `publish:with-links` script automatically handles updating the permanent download links. You can find them at:

- **Latest DMG:** `https://cronusnewupdates.s3.amazonaws.com/Cronus-latest.dmg`
- **Latest ZIP:** `https://cronusnewupdates.s3.amazonaws.com/Cronus-latest.zip`

The website can use these fixed URLs and never needs updating - they will automatically serve the newest build.

### 4 – Troubleshooting quick reference

| Symptom                            | Likely fix                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `AccessControlListNotSupported`    | Enable ACLs on the bucket _or_ add `"acl": null` to the `publish` block in `package.json`.  |
| No toast after "Check for updates" | Ensure the installed build has a lower version than the one referenced in `latest-mac.yml`. |
| Still nothing happens              | Open DevTools → Console, look for `update-status` events to see errors or states.           |

### 4 – Common build issues

**Missing module errors during runtime:**
If you get "Cannot find module" errors (like `debug`, `electron-updater`, etc.), copy the required dependencies from the workspace root:

```bash
cd electron-app
cp -r ../node_modules/electron-updater node_modules/
cp -r ../node_modules/fs-extra node_modules/
cp -r ../node_modules/jsonfile node_modules/
cp -r ../node_modules/debug node_modules/
```

This happens because electron-builder doesn't always properly resolve workspace dependencies.

**Complete build sequence:**

```bash
cd electron-app
# Update version in package.json
# Set environment variables (if needed)
set -a && source .env.production && set +a
# Build source code
NODE_ENV=production bun run build
# Package and publish
npx electron-builder --mac --arm64 --publish always
```
