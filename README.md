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

## License

MIT

## Support

For questions or support, please open an issue in the repository.

### Build Process

The server uses a custom build script (`build.js`) that:

1. Installs dependencies
2. Compiles TypeScript code
3. Copies shared types to the build directory
4. Organizes the compiled files into the correct structure:
   - Moves the main server file to the root of `dist`
   - Copies routers, models, and lib directories to their proper locations
   - Ensures all necessary files are in place for production deployment

This build process is important because:

- It maintains the correct file structure for the server
- It ensures shared types are available to the compiled server code
- It prepares the codebase for production deployment
