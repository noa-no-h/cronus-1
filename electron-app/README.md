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

````

# trackingelectron

## Inter-Process Communication (IPC) Setup Guide

IPC allows Electron's main and renderer processes to communicate. This guide covers common patterns using `contextBridge` for security.

### Pattern 1: Renderer-to-Main (e.g., UI action needs main process task)

**Flow:** `Renderer -> Preload API Call -> Main Process Handler`

1.  **Preload (`src/preload/<name>Preload.ts`):** Define and expose an API function.

    - Uses `ipcRenderer.send('channel', ...)` (one-way) or `ipcRenderer.invoke('channel', ...)` (two-way).

    ```typescript
    // Example: src/preload/floatingPreload.ts
    const floatingApi = {
      requestRecategorizeView: (cat?: Category) =>
        ipcRenderer.send('request-recategorize-view', cat)
    }
    contextBridge.exposeInMainWorld('floatingApi', floatingApi)
    ```

2.  **TypeScript Definition (`*.d.ts`):** Type the exposed API on `window`.

    ```typescript
    // Example: for floatingApi
    export interface FloatingWindowApi {
      requestRecategorizeView: (cat?: Category) => void
    }
    declare global {
      interface Window {
        floatingApi: FloatingWindowApi
      }
    }
    ```

3.  **Main Process (`src/main/index.ts`):** Handle the IPC message.

    - `ipcMain.on('channel', ...)` for `send`, or `ipcMain.handle('channel', ...)` for `invoke`.

    ```typescript
    // Example: handling 'request-recategorize-view'
    ipcMain.on('request-recategorize-view', (_event, cat?: Category) => {
      if (mainWindow) {
        mainWindow.webContents.send('display-recategorize-page', cat)
      }
    })
    ```

4.  **Renderer (`src/renderer/src/...`):** Call the API.
    ```typescript
    // Example: FloatingDisplay.tsx
    window.floatingApi.requestRecategorizeView(categoryDetails)
    ```

### Pattern 2: Main-to-Renderer (e.g., Main process sends event to a UI window)

**Flow:** `Main Process -> TargetWindow.webContents.send() -> Preload API Listener Setup -> Renderer Callback`

1.  **Main Process (`src/main/index.ts`):** Send message to a specific window.

    ```typescript
    mainWindow.webContents.send('display-recategorize-page', dataToSend)
    ```

2.  **Preload (for the target window, e.g., `src/preload/index.ts`):** Expose a function to set up the listener.

    ```typescript
    // Example: for main window's preload
    const mainApi = {
      onDisplayRecategorizePage: (cb: (data?: Category) => void) => {
        const listener = (_e, data?: Category) => cb(data)
        ipcRenderer.on('display-recategorize-page', listener)
        return () => ipcRenderer.removeListener('display-recategorize-page', listener)
      }
    }
    contextBridge.exposeInMainWorld('api', mainApi) // Assuming 'api' for main window
    ```

3.  **TypeScript Definition (`*.d.ts`):** Type this listener setup function.

    ```typescript
    // Example: for mainApi
    export interface MainWindowApi {
      onDisplayRecategorizePage: (cb: (data?: Category) => void) => () => void
    }
    declare global {
      interface Window {
        api: MainWindowApi
      }
    } // Assuming 'api'
    ```

4.  **Renderer (`src/renderer/src/...`):** Use the API to listen.
    ```typescript
    // Example: DashboardView.tsx
    useEffect(() => {
      const cleanup = window.api?.onDisplayRecategorizePage((data) => {
        console.log('Recategorize data:', data)
      })
      return () => cleanup?.() // Call cleanup if it exists
    }, [])
    ```

### Key IPC Practices:

- **`contextBridge`:** Essential for security with `contextIsolation: true`.
- **Channel Names:** Use unique, clear names for IPC channels.
- **Type Definitions:** Maintain `*.d.ts` files for all preload APIs for type safety.
- **Cleanup Listeners:** Always remove listeners (e.g., in `useEffect` cleanup) to prevent memory leaks.
- **Error Handling:** Use try/catch for `invoke/handle` if needed.
````

-

When building the Electron app for production, you must ensure all required dependencies are present in electron-app/node_modules before packaging.
If you use Bun or a monorepo, some dependencies (like electron-updater, fs-extra, jsonfile, debug, etc.) may not be installed where Electron expects them.
Before building, run:

cp -r ../node_modules/electron-updater node_modules/
cp -r ../node_modules/fs-extra node_modules/
cp -r ../node_modules/jsonfile node_modules/
cp -r ../node_modules/debug node_modules/

bun run build:mac
bash create-dmg-manual.sh
