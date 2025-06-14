# whatdidyougetdonetoday

A modern SaaS template with authentication, payments, and a beautiful UI. This template was originally built as an AI-powered spreadsheet tool, which is why you might notice some table-related naming conventions in the codebase.

## Tech Stack

### Core Technologies

- 🚀 **Bun** - Fast JavaScript runtime and package manager
- 🔄 **Monorepo Structure** with workspaces (client, server, shared)
- 📱 **React** + **TypeScript** for the frontend
- 🎨 **Tailwind CSS** + **Shadcn UI** for styling
- 🔐 **tRPC** for type-safe API calls
- 💳 **Stripe** for payments
- 📊 **MongoDB** for database

### Key Libraries

- **Craco** - Used for customizing Create React App configuration without ejecting
- **Lucide React** - Icon library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Zod** - Schema validation

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/               # Source code
│   ├── craco.config.js    # Craco configuration for CRA customization
│   └── package.json       # Frontend dependencies
├── server/                # Backend server
│   ├── src/              # Source code
│   └── package.json      # Backend dependencies
└── shared/               # Shared types and utilities
    ├── types.ts         # Shared TypeScript types
    └── package.json     # Shared package configuration
├── electron-app/           # Electron desktop application
│   ├── src/                # Source code (main, preload, renderer)
│   └── package.json        # Electron app dependencies
```

## Getting Started

### Prerequisites

- Bun (latest version)
- MongoDB
- Stripe account
- Google OAuth credentials

### Environment Variables

Contact the project maintainer to get the required environment variables. You'll need to set up:

- MongoDB connection string
- Stripe API keys
- Google OAuth credentials
- Other service-specific keys

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/whatdidyougetdonetoday-ai.git
cd whatdidyougetdonetoday-ai
```

2. Install dependencies

```bash
bun install
```

3. Start the development servers

For the frontend (in the client directory):

```bash
cd client
bun dev
```

For the backend (in the server directory):

```bash
cd server
bun dev
```

### Running the Server and Electron App Together

To run both the backend server and the Electron application concurrently for development:

```bash
bun run dev:electron-server
```

## Monorepo Structure

This project uses a monorepo structure with three main packages:

### Client (`/client`)

- Built with Create React App + Craco
- Uses Tailwind CSS for styling
- Implements Shadcn UI components
- Handles all frontend logic and UI

### Server (`/server`)

- Bun-based backend
- tRPC for type-safe API endpoints
- MongoDB integration
- Handles authentication and payments

### Shared (`/shared`)

- Contains shared TypeScript types
- Used by both client and server
- Ensures type safety across the stack

### Electron App (`/electron-app`)

- A desktop application built with Electron, React, and TypeScript.
- Provides a native desktop experience.
- For more details, see the [Electron App README](./electron-app/README.md).

## Customization

Search for "PROJECT_NAME" in the codebase to find all instances that need to be replaced with your own brand name. Key files to check:

- `client/src/components/LandingPage.tsx`
- `client/src/App.tsx`
- `client/src/components/navbar.tsx`
- `server/src/index.ts`

## Deployment

The application is set up as a monorepo with separate client and server packages:

- Frontend: Deploy the `client` directory to a static hosting service
- Backend: Deploy the `server` directory to a Node.js hosting service

---

## Deployment on Render

This project is set up for easy deployment on [Render](https://render.com/). Below are the recommended settings for both the client and server services.

### Client (Static Site)

- **Root Directory:** `client`
- **Publish Directory:** `client/build`
- **Build Command:**

  ```sh
  cd client && bun install && bun add -d @craco/craco ajv ajv-keywords && bun run build
  ```

  This command installs dependencies, ensures required build tools are present, and builds the React app.

- **Redirect and Rewrite Rules:**  
  To support client-side routing (React Router), add the following rule:

  | Source | Destination | Action  |
  | ------ | ----------- | ------- |
  | /\*    | /index.html | Rewrite |

  This ensures all routes are handled by your React app.

### Server (Web Service)

- **Root Directory:** `server`
- **Build Command:**
  ```sh
  bun install && bun run build
  ```
- **Start Command:**
  ```sh
  bun start
  ```

> **Note:**  
> The previous project was called "deeptable" (as seen in the screenshots), so you may see references to that name in Render or in some configuration files. You can safely update these to your new project name.

---

## Building and Running the Electron App

There are two primary ways to build the Electron app: a simple, unsigned build for local testing, and a full, signed, and notarized build for production.

### Local Development Build (Unsigned)

For quick local testing, you can create an unsigned build. This does not require any Apple Developer credentials.

1.  **Build the app:**

    ```bash
    cd electron-app
    bun run build:mac
    ```

    This command skips the code signing and notarization steps.

2.  **Open the app:**
    The previous command creates a `.dmg` file in the `electron-app/dist/` directory. To build and open it automatically, you can use a helper script:
    ```bash
    cd electron-app
    bun run build:mac:open
    ```

### Production Build (Signed & Notarized)

To distribute the application, it must be signed with an Apple Developer ID and notarized by Apple.

#### 1. Prerequisites & Setup

- **Apple Developer Account**: You need an active membership.
- **Developer ID Certificate**: Ensure your "Developer ID Application" certificate is installed in your local Keychain.
- **Notarization Credentials**: For notarization, `electron-builder` requires credentials. It is recommended to set them as environment variables (e.g., in your shell profile or a `.env` file):
  ```bash
  # Required for notarization
  export APPLE_ID="your-apple-id@example.com"
  export APPLE_TEAM_ID="YOUR_TEAM_ID"
  export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
  ```
- **Update Signing Identity**: The project is configured to sign with a specific identity. If you use a different certificate, update the hardcoded identity string in these two files:
  - `electron-app/package.json` (in the `build.mac.identity` field)
  - `electron-app/build/scripts/post-build-sign.sh`

#### 2. Build the App

A single command handles the entire cleanup, build, signing, and notarization pipeline:

```bash
cd electron-app
bun run build:mac:open:signed
```

This streamlined script performs the following steps:

1.  **Aggressive Cleanup**: Deletes the old `Cronus.app` from `/Applications`, removes the app's support data from `~/Library/Application Support`, and resets Apple Event permissions with `tccutil`.
2.  **Build**: Compiles the Electron app.
3.  **Deep Sign**: Executes an `afterSign` hook that correctly signs every component (helpers, frameworks, and native `.node` modules) with the necessary entitlements. This script also injects the required `NSAppleEventsUsageDescription` into the helper apps' `Info.plist` files.
4.  **Notarize**: Submits the app to Apple for notarization (when `ENABLE_NOTARIZATION=true`).
5.  **Open**: Once complete, it opens the final `.dmg` installer.

### Distribution

The resulting DMG file in `electron-app/dist/` is fully signed and notarized, ready for distribution. Users on macOS will be able to open it without security warnings.

## Debugging

### Viewing Logs on macOS

The native Objective-C modules use Apple's Unified Logging system (`os_log`). To view these logs for debugging purposes:

1.  Open the **Console.app** on macOS.
2.  Start the Cronus application.
3.  In the search bar of the Console app, enter the following filter and press Enter:
    `    subsystem:com.cronus.app`
    This will display all log messages generated by the native modules, which is essential for diagnosing issues related to window tracking and native code execution.

## Current Challenges

### macOS Apple Events Permission Issue

Despite a comprehensive build and signing process, the application currently faces a persistent issue on macOS where it is unable to retrieve tab information (URL, title) from browsers like Google Chrome.

**The Problem:**

- The application's native module uses AppleScript to communicate with other applications.
- In the signed and notarized production build, this communication fails with the error: `Not authorised to send Apple events to Google Chrome.`
- Crucially, the operating system never displays the standard permission prompt to the user to grant this access.

**Current Implementation State:**

- The build process uses a robust `afterSign` script to "deep sign" every executable component within the app bundle, including helper apps, frameworks, and the native `.node` module.
- The `post-build-sign.sh` script correctly injects the required `NSAppleEventsUsageDescription` key into the `Info.plist` of all helper apps.
- A single, authoritative `entitlements.mac.plist` file is used, containing all necessary entitlements for a hardened runtime app that needs to perform these actions (`com.apple.security.automation.apple-events`, `com.apple.security.cs.disable-library-validation`, etc.).
- A pre-build cleanup script ensures the application and its support files are completely removed before each build to prevent issues with cached data or permissions.

The root cause of why the OS denies the permission without prompting the user remains unresolved, despite the build configuration adhering to all known best practices for this scenario.
