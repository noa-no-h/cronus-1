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

The Electron app uses [Electron Builder](https://www.electron.build/) for packaging and distribution, with a streamlined build system offering different options for development and production.

### Development Build (Signed App Bundle)

For development and testing, you can create a signed app bundle without creating a DMG:

```bash
cd electron-app
bun run build:mac:app-only
```

This creates a signed `.app` bundle in `electron-app/dist/mac-arm64/` that you can run directly.

### Production Build (Signed App + DMG)

For distribution, create both a signed app and a proper installer DMG:

```bash
cd electron-app
bun run build:mac:dmg
```

This creates:

- A signed `Cronus.app` bundle
- A distributable DMG with Applications folder shortcut
- Automatic signature verification
- Opens the DMG when complete

### Quick DMG Creation

If you already have a built app and just want to create a new DMG:

```bash
cd electron-app
bun run build:mac:dmg-only
```

This creates a DMG from the existing app bundle without rebuilding.

### Available Build Scripts

| Script               | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `build:mac:app-only` | Creates signed `.app` bundle (fast, for testing) |
| `build:mac:dmg`      | Complete build + signed DMG (for distribution)   |
| `build:mac:dmg-only` | Creates DMG from existing app (quick packaging)  |

### Code Signing Setup

The build system uses environment variables for code signing:

- **Certificate**: Place your `.p12` certificate file in `electron-app/build-assets/mac-cert.p12`
- **Password**: The certificate password is configured in the build scripts
- **Identity**: Update the identity in `build-mac.sh` if using a different certificate

### Distribution

The resulting DMG files in `electron-app/dist/` are:

- ✅ **Fully signed** with your Developer ID certificate
- ✅ **Include Applications folder** for easy installation
- ✅ **Signature verified** automatically during build
- ✅ **Ready for distribution** to end users

Users can install by opening the DMG and dragging the app to the Applications folder.

### Apple Events Permission Resolution

**✅ RESOLVED**: The Apple Events permission issue has been successfully resolved through proper code signing. The app now:

- Shows the permission prompt to users when first accessing browser information
- Successfully retrieves browser tab information after permission is granted
- Works reliably with the current build and signing process

**Build Commands:**

- `bun run build:mac:app-only` - For development/testing
- `bun run build:mac:dmg` - For production distribution

## Debugging

### Viewing Logs on macOS

The native Objective-C modules use Apple's Unified Logging system (`os_log`). To view these logs for debugging purposes:

1.  Open the **Console.app** on macOS.
2.  Start the Cronus application.
3.  In the search bar of the Console app, enter the following filter and press Enter:
    `    subsystem:com.cronus.app`
    This will display all log messages generated by the native modules, which is essential for diagnosing issues related to window tracking and native code execution.
