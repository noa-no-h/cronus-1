# Cronus - Self-Hosted Desktop Time Tracker

A powerful, AI-driven desktop time tracker that automatically categorizes your activities and provides detailed insights into your productivity patterns. Built with Electron, React, and Node.js, Cronus runs entirely on your own infrastructure for complete privacy and control.

## ✨ Features

- **🤖 AI-Powered Categorization**: Automatically categorizes activities using OpenAI GPT models
- **📊 Detailed Analytics**: Track time spent across different apps and categories
- **🔒 Privacy-First**: All data stays on your infrastructure - no external data sharing
- **🖥️ Native macOS Integration**: Deep system integration with native window tracking
- **📅 Calendar Integration**: Optional Google Calendar sync for comprehensive time tracking
- **⚡ Real-Time Monitoring**: Live activity tracking with minimal system impact
- **🎨 Beautiful UI**: Modern, responsive interface built with React and Tailwind CSS

## 🏗️ Architecture

- **Desktop App**: Electron application with native macOS modules for window tracking
- **Server**: Node.js/Express backend with tRPC for type-safe API communication
- **Database**: MongoDB for data storage
- **AI Integration**: OpenAI GPT models for intelligent activity categorization

## 📋 Prerequisites

Before setting up Cronus, ensure you have:

- **Node.js** (v18 or higher) and **Bun** package manager
- **MongoDB** database (local or cloud)
- **OpenAI API key** for AI categorization features
- **macOS** (required for native window tracking modules)
- **Google OAuth credentials** (optional, for calendar integration)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cronus-desktop-tracker.git
cd cronus-desktop-tracker
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

#### Server Configuration
Copy and configure the server environment file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:

```bash
# Database
MONGODB_URI="mongodb://localhost:27017/cronus"

# AI Features (Required)
OPENAI_API_KEY="your_openai_api_key_here"

# Authentication (Required for app to function)
AUTH_SECRET="your_secure_random_string_here"

# Google OAuth (Optional - for calendar integration)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Stripe (Optional - remove if not using payments)
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
STRIPE_PRICE_ID="your_stripe_price_id"

# Email service (Optional)
LOOPS_API_KEY="your_loops_api_key"

# Server Configuration
PORT="3001"
CLIENT_URL="http://localhost:3000"
```

#### Electron App Configuration
Copy the electron app environment file:

```bash
cp electron-app/.env.example electron-app/.env
```

The electron app will automatically connect to your local server at `http://localhost:3001`.

### 4. Set Up MongoDB

#### Option A: Local MongoDB
Install and run MongoDB locally:

```bash
# macOS with Homebrew
brew install mongodb-community
brew services start mongodb-community

# The default connection string is:
# mongodb://localhost:27017/cronus
```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI` in `server/.env`

### 5. Get OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `server/.env` file as `OPENAI_API_KEY`

### 6. Build Shared Dependencies

```bash
bun run build:shared
```

### 7. Start the Application

#### Terminal 1 - Start the Server:
```bash
cd server
bun dev
```

#### Terminal 2 - Start the Desktop App:
```bash
cd electron-app  
bun dev
```

The desktop app will launch automatically and connect to your local server.

## 🔧 Configuration Options

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cronus` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` |
| `AUTH_SECRET` | Secret for JWT token signing | Random 32+ character string |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Not set |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Not set |
| `PORT` | Server port | `3001` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 📦 Production Deployment

### Building the Application

```bash
# Build all components
bun run build

# Or build individually
bun run build:shared
bun run build:server  
bun run build:electron
```

### Server Deployment

Deploy the `server/` directory to your preferred hosting platform:

```bash
cd server
bun run build  # Compile TypeScript
bun start      # Start the production server
```

### Desktop App Distribution

Build the desktop application for distribution:

```bash
cd electron-app
bun run build                    # Development build
bun run build:local              # Local production build (unsigned)
```

For signed releases, see the [Electron App README](./electron-app/README.md) for detailed code signing instructions.

## 🛠️ Development

### Project Structure

```
cronus-desktop-tracker/
├── electron-app/           # Electron desktop application
│   ├── src/
│   │   ├── main/          # Electron main process
│   │   ├── renderer/      # React frontend
│   │   └── preload/       # Preload scripts
├── server/                # Backend server
│   ├── src/
│   │   ├── routers/       # tRPC routers
│   │   ├── models/        # Database models
│   │   └── services/      # Business logic
└── shared/                # Shared types and utilities
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev:electron-server` | Run server + electron app together |
| `bun run build` | Build all components |
| `bun run format` | Format code with Prettier |
| `bun run lint` | Lint code with ESLint |

### Native Modules

The app includes native macOS modules for window tracking. If you need to rebuild them:

```bash
cd electron-app
bun run native-modules:rebuild:arm  # For Apple Silicon
bun run native-modules:rebuild:x64  # For Intel Macs
```

## 🔒 Privacy & Security

- **Local Data Storage**: All your activity data is stored in your own MongoDB database
- **No External Data Sharing**: Your data never leaves your infrastructure
- **Encryption**: JWT tokens for secure authentication
- **Screenshot Privacy**: Screenshots are immediately deleted after text extraction
- **Open Source**: Full transparency - audit the code yourself

## ❓ Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB if not running
brew services start mongodb-community
```

**OpenAI API Errors**
- Verify your API key is correct and has sufficient credits
- Check the OpenAI API status page for outages

**Native Module Issues**
```bash
# Rebuild native modules
cd electron-app
bun run native-modules:rebuild:arm
```

**Permission Issues (macOS)**
- The app requires Accessibility permissions to track window activity
- System Preferences > Security & Privacy > Privacy > Accessibility

### Logs and Debugging

**Server logs**: Check terminal output where you started `bun dev`

**Electron logs**: 
- Development: Check DevTools console (View > Toggle Developer Tools)
- Production: Logs are in `~/Library/Application Support/Cronus/logs/`

**macOS system logs**:
```bash
# View native module logs in Console.app
# Filter by subsystem: com.cronus.app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI categorization powered by [OpenAI](https://openai.com/)
- Type-safe APIs with [tRPC](https://trpc.io/)

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/your-username/cronus-desktop-tracker/issues)
3. Create a new issue with detailed information about your problem

**Made with ❤️ for productivity enthusiasts who value privacy and control over their data.**
