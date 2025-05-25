# electron-app

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Project Structure Overview

```
electron-app/
├── out/                     # Build output (Main, Preload, Renderer JS files)
├── resources/               # Static assets (e.g., icons)
├── src/
│   ├── main/                # Main process source (Node.js environment)
│   │   └── index.ts
│   ├── preload/             # Preload script source
│   │   ├── index.ts
│   │   └── index.d.ts       # Type definitions for preload API
│   ├── renderer/            # Renderer process source (React UI)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx     # React entry point
│   │   │   ├── env.d.ts     # Renderer environment types
│   │   │   └── components/  # UI components (example)
│   │   └── index.html       # HTML entry for renderer
│   └── native-modules/      # Native Node.js addons
│       └── native-windows/  # Example native module
│           ├── macos/       # macOS specific native code
│           │   ├── activeWindowObserver.h
│           │   ├── activeWindowObserver.mm
│           │   └── nativeWindows.mm
│           ├── binding.gyp  # node-gyp build configuration
│           ├── index.ts     # TypeScript wrapper for native module
│           └── package.json # for the native module
├── .eslintrc.js (or .mjs, eslint.config.mjs) # ESLint configuration
├── .gitignore
├── package.json
├── tsconfig.json            # Base TypeScript configuration (if present)
├── tsconfig.node.json       # TypeScript config for main/preload
├── tsconfig.web.json        # TypeScript config for renderer
└── README.md
```

# trackingelectron
