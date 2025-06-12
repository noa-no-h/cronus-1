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

## Building the Electron App

### Prerequisites

- **macOS**: For building macOS DMG files
- **Node.js**: Version 18 or higher
- **Bun**: Latest version
- **Xcode Command Line Tools**: For native module compilation
- **Apple Developer Account**: For code signing (optional but recommended)

### Build Process

The Electron app build process involves several steps to ensure proper module resolution and packaging:

#### 1. Build Shared Package

First, build the shared package which contains common types and utilities:

```bash
cd shared
bun run build
```

This creates the `dist/` directory with compiled JavaScript files and TypeScript declarations.

#### 2. Build Server (if needed)

If the Electron app depends on server types, build the server package:

```bash
cd server
bun run build
```

#### 3. Build Electron App

Navigate to the electron-app directory and run the build:

```bash
cd electron-app
bun run build:mac
```

This command:

- Builds the main process, preload scripts, and renderer process
- Packages the app using electron-builder
- Creates DMG files for distribution

#### 4. Handle Native Modules

The project uses a native Node.js module for observing system events. This module requires special handling during the build process:

- **Rebuilding:** The native module must be rebuilt whenever Electron or Node.js versions change. Use this command:

  ```bash
  cd electron-app
  bun run native-modules:rebuild:arm
  ```

- **Packaging:** The compiled `.node` file is included in the final application package via the `extraResources` configuration in `electron-app/package.json`.

- **Loading:** The module is loaded with a dynamic path that works in both development and production, preventing "Cannot find module" errors.

### Build Output

After a successful build, you'll find the following files in `electron-app/dist/`:

- `Cronus-1.0.0-arm64.dmg` - ARM64 (Apple Silicon) version
- `Cronus-1.0.0.dmg` - Universal version (Intel + ARM64)
- `mac/` and `mac-arm64/` directories containing the app bundles

### Development Build

For development and testing:

```bash
cd electron-app
bun run dev
```

This starts the Electron app in development mode with hot reloading.

### Troubleshooting

#### Common Issues

1. **Module Resolution Errors**

   - Ensure the shared package is built before building the Electron app
   - Check that all imports use the correct paths (see Import Guidelines below)

2. **External File Inclusion Errors**

   - The build configuration excludes files from outside the electron-app directory
   - Shared files are included as extra resources, not as direct imports

3. **TypeScript Compilation Errors**

   - Run `bun run build` in the shared directory to regenerate type definitions
   - Ensure all dependencies are installed with `bun install`

4. **Code Signing Issues**

   - For distribution, you'll need an Apple Developer account
   - Update the `electron-builder.yml` configuration with your signing identity

5. **Native Module Errors**
   - If you see a "Cannot find module" error for `nativeWindows.node`, ensure the module has been rebuilt with `bun run native-modules:rebuild:arm`.
   - Verify that the `extraResources` path in `electron-app/package.json` correctly points to the compiled `.node` file.

#### Import Guidelines

The Electron app uses specific import patterns to work with the monorepo structure:

```

```
