# Cronus - Self-Hosted Desktop Time Tracker

> A powerful, AI-driven desktop time tracker that runs entirely on your own infrastructure. Track your productivity with complete privacy and control over your data.

![macOS](https://img.shields.io/badge/macOS-supported-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green) ![MongoDB](https://img.shields.io/badge/MongoDB-supported-green)

## ✨ What Cronus Does

Cronus automatically tracks your desktop activity and uses AI to categorize your time into meaningful insights:

- **🤖 Intelligent Categorization**: OpenAI GPT models automatically organize your activities
- **📊 Beautiful Analytics**: Visual insights into your productivity patterns  
- **🔒 Privacy-First**: All data stays on your computer and servers
- **⚡ Effortless Tracking**: Native macOS integration with minimal system impact
- **📅 Calendar Integration**: Sync with Google Calendar for comprehensive time tracking
- **🎨 Modern Interface**: Clean, responsive UI built with React and Tailwind CSS

---

## 🚀 Quick Start Guide

> **Note**: This guide provides the exact commands we tested. Follow each step in order for a smooth setup experience.

### Prerequisites

Before starting, ensure you have:
- **macOS** (required for window tracking)
- **Bun package manager** ([install here](https://bun.sh/))
- **Homebrew** ([install here](https://brew.sh/)) 
- **OpenAI API account** ([sign up here](https://platform.openai.com/))

---

## 📋 Step-by-Step Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/cronus-desktop-tracker.git
cd cronus-desktop-tracker

# Install all dependencies
bun install
```

**Expected output**: Dependencies install successfully with no errors.

---

### Step 2: Set Up MongoDB

**Choose Option A (Local) or Option B (Cloud):**

#### Option A: Local MongoDB (Recommended for Testing)

```bash
# Install MongoDB via Homebrew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
brew services list | grep mongodb
```

**Expected output**: `mongodb-community started`

#### Option B: MongoDB Atlas (Cloud)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and new cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Keep this for Step 3

---

### Step 3: Configure Environment Variables

#### Set Up Server Environment

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Open the file in your editor
open server/.env
```

**Edit `server/.env` with these values:**

```env
# Database Connection
MONGODB_URI="mongodb://localhost:27017/cronus"
# (Or use your Atlas connection string if you chose Option B)

# AI Features - REQUIRED
OPENAI_API_KEY="your_openai_api_key_here"

# Authentication - REQUIRED  
AUTH_SECRET="your_secure_random_32_character_string_here"

# Optional Services (you can leave these as-is for testing)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
LOOPS_API_KEY="your_loops_api_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
STRIPE_PRICE_ID="your_stripe_price_id"

# Server Configuration
PORT="3001"
CLIENT_URL="http://localhost:3000"
```

#### Set Up Electron App Environment

```bash
# Copy the example environment file
cp electron-app/.env.example electron-app/.env
```

**Note**: The electron app automatically connects to `localhost:3001` - no editing needed.

---

### Step 4: Get Your OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in `server/.env` as the `OPENAI_API_KEY` value

**Important**: You'll need a few dollars of OpenAI credits for the AI categorization to work.

---

### Step 5: Generate Authentication Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

Copy the output and paste it as the `AUTH_SECRET` value in `server/.env`.

---

### Step 6: Build and Start

#### Build Shared Dependencies

```bash
bun run build:shared
```

**Expected output**: TypeScript compilation completes successfully.

#### Start the Server

Open a new terminal window and run:

```bash
cd server
bun dev
```

**Expected output**:
```
Server running on port 3001
Connected to MongoDB: mongodb://localhost:27017/cronus
```

#### Start the Desktop App

Open another terminal window and run:

```bash
cd electron-app
bun dev
```

**Expected output**: The Cronus desktop app launches automatically.

---

## 🎯 Verify Your Setup

After completing the steps above, you should see:

- ✅ **Server terminal**: Shows "Connected to MongoDB" and "Server running on port 3001"
- ✅ **Desktop app**: Opens without errors
- ✅ **Login screen**: Appears in the desktop app
- ✅ **Account creation**: You can create a new account

### Test the Core Features

1. **Create an Account**: Use any email and password in the app
2. **Grant Permissions**: Allow accessibility permissions when macOS prompts
3. **Track Activity**: Switch between apps (browser, text editor, etc.)
4. **View Analytics**: Check the dashboard for categorized activities

---

## 🛠️ Development & Configuration

### Project Structure

```
cronus-desktop-tracker/
├── electron-app/           # Desktop application
│   ├── src/main/          # Electron main process  
│   ├── src/renderer/      # React UI components
│   └── src/preload/       # Preload scripts
├── server/                # Backend API server
│   ├── src/routers/       # tRPC API routes
│   ├── src/models/        # Database models
│   └── src/services/      # Business logic
├── shared/                # Shared types & utilities
└── docs/                  # Documentation
```

### Available Commands

```bash
# Development
bun dev:electron-server    # Start both server and app together
bun run build:shared      # Build shared dependencies  
bun run build:server      # Build server for production
bun run build:electron    # Build electron app

# Code Quality
bun run format            # Format code with Prettier
bun run lint             # Check code with ESLint
bun run typecheck        # Verify TypeScript types
```

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb://localhost:27017/cronus` |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for categorization | `sk-...` |
| `AUTH_SECRET` | ✅ | JWT signing secret | 32+ character random string |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID | For calendar integration |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret | For calendar integration |
| `PORT` | ❌ | Server port | `3001` (default) |

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### MongoDB Connection Failed

**Problem**: Server shows "MongoDB connection error"

**Solution**:
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB if stopped
brew services start mongodb-community

# Check logs if still failing
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

#### OpenAI API Errors

**Problem**: Activities aren't being categorized

**Solutions**:
- Verify your API key is correct in `server/.env`
- Check your OpenAI account has available credits
- Visit [OpenAI Status](https://status.openai.com/) for service issues

#### Electron App Won't Start

**Problem**: Desktop app crashes or won't launch

**Solution**:
```bash
# Rebuild native modules
cd electron-app
bun run native-modules:rebuild:arm  # For Apple Silicon
bun run native-modules:rebuild:x64  # For Intel Macs

# Clear electron cache
rm -rf node_modules/.cache
```

#### Permission Issues (macOS)

**Problem**: Window tracking doesn't work

**Solution**:
1. Open **System Preferences** > **Security & Privacy** > **Privacy**
2. Click **Accessibility** in the left sidebar
3. Click the lock icon and enter your password
4. Add the Cronus app and ensure it's checked

#### Port Already in Use

**Problem**: "Port 3001 is already in use"

**Solution**:
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or use a different port in server/.env
PORT="3002"
```

### Getting Help

If you encounter issues:

1. **Check the logs**: Look at both terminal windows for error messages
2. **Search existing issues**: [GitHub Issues](https://github.com/your-username/cronus-desktop-tracker/issues)
3. **Create a new issue**: Include your system info, error messages, and steps to reproduce

---

## 🔒 Privacy & Security

### Data Handling

- **Local Storage**: All activity data is stored in your MongoDB database
- **Screenshot Privacy**: Screenshots are taken only for text extraction, then immediately deleted
- **No Tracking**: No analytics, telemetry, or data collection beyond what you configure
- **Open Source**: Full transparency - audit the code yourself

### Network Communication

- **AI Processing**: Activity titles sent to OpenAI API for categorization (optional)
- **Calendar Sync**: Direct connection to Google Calendar API (optional)
- **No Third Parties**: No other external services contacted

---

## 🏗️ Production Deployment

### Building for Distribution

```bash
# Build all components
bun run build

# Create distributable app (macOS)
cd electron-app
bun run build:local  # Unsigned local build
bun run build       # Full production build (requires signing)
```

### Server Deployment

Deploy the `server/` directory to your preferred hosting platform:

```bash
# Compile server for production
cd server  
bun run build

# Start production server
NODE_ENV=production bun start
```

### Docker Deployment

Use the included Docker setup for easy deployment:

```bash
# Start MongoDB and server with Docker
docker-compose up -d

# The desktop app connects to your dockerized server
cd electron-app && bun dev
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style guidelines  
- Pull request process
- Issue reporting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/) for cross-platform desktop apps
- UI powered by [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- API layer with [tRPC](https://trpc.io/) for type safety
- AI categorization by [OpenAI](https://openai.com/)
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">

**Made with ❤️ for productivity enthusiasts who value privacy and control**

[⭐ Star on GitHub](https://github.com/your-username/cronus-desktop-tracker) • [🐛 Report Bug](https://github.com/your-username/cronus-desktop-tracker/issues) • [✨ Request Feature](https://github.com/your-username/cronus-desktop-tracker/issues)

</div>