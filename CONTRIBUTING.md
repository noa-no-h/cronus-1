# Contributing to Cronus Desktop Tracker

Thank you for your interest in contributing to Cronus! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/cronus-desktop-tracker.git
   cd cronus-desktop-tracker
   ```
3. **Install dependencies**:
   ```bash
   bun install
   ```
4. **Set up your development environment** following the [README setup guide](README.md#quick-start)

## 🏗️ Development Workflow

### Branch Strategy
- Create feature branches from `main`: `git checkout -b feature/your-feature-name`
- Use descriptive branch names: `feature/ai-categorization-improvements`, `fix/mongodb-connection-error`

### Code Style
- **TypeScript**: All code must be properly typed
- **Prettier**: Code is automatically formatted with Prettier
- **ESLint**: Follow the existing linting rules
- **Consistent naming**: Use camelCase for variables/functions, PascalCase for components/classes

### Running the Development Environment
```bash
# Start server and electron app together
bun run dev:electron-server

# Or separately:
# Terminal 1:
cd server && bun dev

# Terminal 2:  
cd electron-app && bun dev
```

### Testing
- Write tests for new functionality
- Ensure existing tests pass before submitting PR
- Test on macOS (required for native modules)

## 📝 Pull Request Process

### Before Submitting
1. **Ensure your code follows the style guide**:
   ```bash
   bun run format        # Format code
   bun run lint          # Check linting
   bun run typecheck     # Check TypeScript
   ```

2. **Test your changes thoroughly**:
   - Manual testing of the desktop app
   - Verify server endpoints work correctly
   - Test with different configurations (local MongoDB, Atlas, etc.)

3. **Update documentation** if needed:
   - Update README.md for new features
   - Add/update comments for complex code
   - Update environment variable examples

### Pull Request Guidelines

1. **Create a clear title**: 
   - ✅ `feat: Add custom category colors in settings`
   - ✅ `fix: Resolve MongoDB connection timeout issue`
   - ❌ `Update stuff`

2. **Provide detailed description**:
   ```markdown
   ## Description
   Brief description of what this PR does
   
   ## Changes Made
   - Specific change 1
   - Specific change 2
   
   ## Testing
   - [ ] Tested locally on macOS
   - [ ] Verified MongoDB connection works
   - [ ] Checked OpenAI API integration
   
   ## Screenshots (if UI changes)
   [Include screenshots of UI changes]
   ```

3. **Keep PRs focused**: One feature or fix per PR

4. **Link related issues**: Use `Fixes #123` or `Addresses #456`

## 🐛 Bug Reports

When reporting bugs, please include:

- **Operating System**: macOS version
- **Node.js/Bun version**: `node --version && bun --version`
- **Steps to reproduce**: Clear, step-by-step instructions
- **Expected vs actual behavior**
- **Console logs**: Include relevant error messages
- **Environment setup**: Local MongoDB vs Atlas, OpenAI API key setup, etc.

### Bug Report Template
```markdown
**Environment:**
- macOS: [version]
- Node.js: [version] 
- Bun: [version]
- MongoDB: [local/Atlas]

**Steps to Reproduce:**
1. Start the application
2. Navigate to...
3. Click on...
4. Error occurs

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Console Logs:**
```
[paste console errors here]
```

**Additional Context:**
[Any other relevant information]
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Search existing issues** to avoid duplicates
2. **Provide clear use case**: Why is this feature needed?
3. **Describe the solution**: How should it work?
4. **Consider alternatives**: Are there other ways to solve this?

## 🔧 Development Guidelines

### Code Organization
- **Components**: Place React components in appropriate directories
- **Services**: Business logic goes in `server/src/services/`
- **Types**: Shared types in `shared/src/types.ts`
- **Utilities**: Helper functions in appropriate `lib/` directories

### Database Changes
- **Migrations**: Create migration scripts for schema changes
- **Backward compatibility**: Ensure changes don't break existing data
- **Indexes**: Add appropriate indexes for query performance

### API Changes
- **tRPC**: Maintain type safety across client-server boundary
- **Validation**: Use Zod schemas for input validation
- **Error handling**: Provide meaningful error messages

### Native Modules
- **macOS only**: Native modules are macOS-specific
- **Rebuild after changes**: Use rebuild scripts after native code changes
- **Permission handling**: Properly handle macOS permissions

## 🧪 Testing Guidelines

### Areas to Test
- **Authentication flow**: Login/logout functionality
- **Activity tracking**: Window detection and categorization
- **Database operations**: CRUD operations work correctly
- **AI categorization**: OpenAI API integration
- **Settings**: Configuration changes persist
- **Electron app**: Building and running desktop app

### Test Environment Setup
```bash
# Set up test MongoDB (or use existing)
export MONGODB_URI="mongodb://localhost:27017/cronus-test"

# Use test OpenAI API key (with limited credits)
export OPENAI_API_KEY="your-test-api-key"

# Run tests
bun test
```

## 📚 Resources

- **Electron Documentation**: https://electronjs.org/docs
- **tRPC Documentation**: https://trpc.io/docs
- **React Documentation**: https://react.dev/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **OpenAI API Documentation**: https://platform.openai.com/docs

## ❓ Questions?

- **GitHub Discussions**: Use for general questions about the project
- **Issues**: For specific bugs or feature requests
- **Code Review**: Ask questions directly in PR comments

## 📜 Code of Conduct

- **Be respectful**: Treat all contributors with respect
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone is learning
- **Be inclusive**: Welcome contributors of all backgrounds and skill levels

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributor list
- Release notes for significant contributions
- README acknowledgments section

Thank you for contributing to Cronus! 🎉