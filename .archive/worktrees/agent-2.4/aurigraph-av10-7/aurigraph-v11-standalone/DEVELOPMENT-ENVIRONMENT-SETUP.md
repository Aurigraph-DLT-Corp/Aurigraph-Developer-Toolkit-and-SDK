# Development Environment Setup Guide

**Target Audience:** New developers joining Sprint 20 Portal Integration Team
**Time to Complete:** 30-60 minutes
**Prerequisites:** macOS, Linux, or Windows with WSL2

---

## Overview

This guide provides step-by-step instructions to set up a complete development environment for the Aurigraph V11 Enterprise Portal integration project. After completing this guide, you will have:

- ✅ Backend (Java 21 + Quarkus) running on port 9003
- ✅ Frontend (React + TypeScript + Vite) running on port 3000
- ✅ PostgreSQL database running on port 5432
- ✅ WebSocket endpoints accessible for real-time features
- ✅ IDE configured with proper extensions and settings

---

## System Requirements

### Hardware Requirements
- **CPU:** 4+ cores (8+ cores recommended)
- **RAM:** 8GB minimum (16GB recommended)
- **Disk:** 10GB free space for dependencies and builds

### Operating System
- **macOS:** 11.0 (Big Sur) or later
- **Linux:** Ubuntu 20.04+, Fedora 33+, or similar
- **Windows:** Windows 10/11 with WSL2 (Ubuntu 20.04+)

---

## Part 1: Backend Dependencies

### 1.1 Install Java 21

#### macOS (Using Homebrew)
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Java 21
brew install openjdk@21

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For compilers to find openjdk@21
export CPPFLAGS="-I/opt/homebrew/opt/openjdk@21/include"

# Verify installation
java --version
```

**Expected Output:**
```
openjdk 21.0.x 2024-xx-xx
OpenJDK Runtime Environment (build 21.0.x)
OpenJDK 64-Bit Server VM (build 21.0.x)
```

---

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Java 21
sudo apt install openjdk-21-jdk

# Set Java 21 as default (if multiple versions installed)
sudo update-alternatives --config java

# Verify installation
java --version
```

---

#### Windows (WSL2)
```bash
# In WSL2 Ubuntu terminal
sudo apt update
sudo apt install openjdk-21-jdk

# Verify
java --version
```

---

### 1.2 Install Maven

Maven is included with Quarkus, but you can also install it system-wide:

#### macOS
```bash
brew install maven

# Verify
mvn --version
```

**Expected Output:**
```
Apache Maven 3.9.x
Maven home: /opt/homebrew/Cellar/maven/3.9.x/libexec
Java version: 21.0.x
```

---

#### Linux
```bash
sudo apt install maven

# Verify
mvn --version
```

---

### 1.3 Install PostgreSQL

#### macOS
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb aurigraph

# Verify
psql -d aurigraph -c "SELECT version();"
```

---

#### Linux
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
sudo -u postgres createuser -s $USER

# Create database
createdb aurigraph

# Verify
psql -d aurigraph -c "SELECT version();"
```

---

#### Database Configuration

**Create test user:**
```bash
psql -d aurigraph

-- In psql prompt:
CREATE USER aurigraph_user WITH PASSWORD 'aurigraph_password';
GRANT ALL PRIVILEGES ON DATABASE aurigraph TO aurigraph_user;
\q
```

**Test connection:**
```bash
psql -h localhost -U aurigraph_user -d aurigraph -c "SELECT 1;"
```

---

## Part 2: Frontend Dependencies

### 2.1 Install Node.js 20

#### macOS (Using nvm - Recommended)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.zshrc  # or source ~/.bash_profile

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Expected: v20.x.x
npm --version   # Expected: 10.x.x
```

---

#### macOS (Using Homebrew)
```bash
# Install Node.js 20
brew install node@20

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
node --version
npm --version
```

---

#### Linux (Using nvm - Recommended)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
npm --version
```

---

#### Windows (WSL2)
```bash
# Same as Linux instructions above
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

### 2.2 Install pnpm (Optional but Recommended)

pnpm is faster than npm and uses less disk space:

```bash
npm install -g pnpm

# Verify
pnpm --version  # Expected: 9.x.x
```

**Note:** You can use `npm` instead of `pnpm` throughout this guide. Just replace `pnpm` with `npm`.

---

## Part 3: Development Tools

### 3.1 Install Git

#### macOS
```bash
# Git comes pre-installed on macOS
git --version

# If not installed:
brew install git
```

---

#### Linux
```bash
sudo apt install git

# Verify
git --version
```

---

### 3.2 Configure Git

```bash
# Set your name and email (used for commits)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable color output
git config --global color.ui auto

# Set default editor (optional)
git config --global core.editor "code --wait"  # VS Code
# or
git config --global core.editor "vim"  # Vim
```

---

### 3.3 Install Docker (For Containerized Builds)

#### macOS
```bash
# Download and install Docker Desktop from:
# https://www.docker.com/products/docker-desktop

# Or using Homebrew:
brew install --cask docker

# Start Docker Desktop
open -a Docker

# Verify
docker --version
docker ps
```

---

#### Linux
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoids sudo)
sudo usermod -aG docker $USER

# Log out and log back in, then verify
docker --version
docker ps
```

---

## Part 4: Clone Repository

### 4.1 Clone the Repository

```bash
# Navigate to your projects directory
cd ~/projects  # or wherever you keep your projects

# Clone repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git

# Navigate to project
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Verify directory structure
ls -la
```

**Expected Output:**
```
drwxr-xr-x  enterprise-portal/
drwxr-xr-x  src/
-rw-r--r--  pom.xml
-rw-r--r--  README.md
...
```

---

### 4.2 Checkout Correct Branch

```bash
# Ensure you're on main branch
git checkout main

# Pull latest changes
git pull origin main

# Create your feature branch (if needed)
git checkout -b feature/sprint-20-auth-integration
```

---

## Part 5: Backend Setup

### 5.1 Configure Backend

**Edit application properties:**
```bash
# Navigate to backend
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Copy example config (if exists)
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Or edit directly:
nano src/main/resources/application.properties
```

**Required Configuration:**
```properties
# HTTP Configuration
quarkus.http.port=9003
quarkus.http.host=0.0.0.0

# CORS Configuration (CRITICAL for frontend)
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:3000,http://localhost:3001
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.headers=Content-Type,Authorization,X-API-Key,Cookie
quarkus.http.cors.exposed-headers=Set-Cookie
quarkus.http.cors.access-control-allow-credentials=true

# Database Configuration
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph_user
quarkus.datasource.password=aurigraph_password
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph

# Hibernate Configuration
quarkus.hibernate-orm.database.generation=update
quarkus.hibernate-orm.log.sql=false

# Flyway Migration (Optional)
quarkus.flyway.migrate-at-start=true

# Session Configuration
quarkus.session.timeout=8H
quarkus.session.cookie-name=session_id
quarkus.session.cookie-path=/
quarkus.session.cookie-http-only=true

# WebSocket Configuration
quarkus.websocket.max-frame-size=10M
quarkus.websocket.idle-timeout=30M

# Logging
quarkus.log.level=INFO
quarkus.log.category."io.aurigraph".level=DEBUG
```

---

### 5.2 Build Backend

```bash
# Clean and compile
./mvnw clean package -DskipTests

# Expected output:
# [INFO] BUILD SUCCESS
# [INFO] Total time: XX s
```

**If build fails:**
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Try again
./mvnw clean package -DskipTests
```

---

### 5.3 Start Backend in Development Mode

```bash
# Start Quarkus dev mode (hot reload enabled)
./mvnw quarkus:dev

# Expected output:
# Listening on: http://0.0.0.0:9003
# __  ____  __  _____   ___  __ ____  ______
#  --/ __ \/ / / / _ | / _ \/ //_/ / / / __/
#  -/ /_/ / /_/ / __ |/ , _/ ,< / /_/ /\ \
# --\___\_\____/_/ |_/_/|_/_/|_|\____/___/
# INFO  [io.quarkus] (Quarkus Main Thread) aurigraph-v11-standalone 11.4.4 on JVM started in X.XXXs.
```

**Test backend is running:**
```bash
# In a new terminal:
curl http://localhost:9003/q/health
```

**Expected Response:**
```json
{
  "status": "UP",
  "checks": [...]
}
```

---

## Part 6: Frontend Setup

### 6.1 Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd enterprise-portal

# Clean previous installations
rm -rf node_modules package-lock.json pnpm-lock.yaml

# Install dependencies
npm install
# or
pnpm install

# Expected output:
# added XXX packages in XX s
```

**Common Issues:**
```bash
# If you get EACCES errors:
sudo chown -R $USER ~/.npm

# If you get network errors:
npm config set registry https://registry.npmjs.org/
npm install
```

---

### 6.2 Configure Frontend Environment

**Create `.env` file:**
```bash
# In enterprise-portal directory
touch .env
nano .env
```

**Add configuration:**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:9003/api/v11
VITE_WS_BASE_URL=ws://localhost:9003

# Feature Flags
VITE_WEBSOCKET_ENABLED=true
VITE_REAL_TIME_METRICS=true

# Optional: API Key
VITE_REACT_APP_API_KEY=your-api-key-here
```

**Save file:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### 6.3 Start Frontend Development Server

```bash
# Start Vite dev server
npm run dev
# or
pnpm dev

# Expected output:
#   VITE v5.0.8  ready in XXXms
#
#   ➜  Local:   http://localhost:3000/
#   ➜  Network: use --host to expose
#   ➜  press h + enter to show help
```

**Test frontend is running:**
```bash
# In a new terminal:
curl http://localhost:3000
```

**Expected:** HTML response with React app

---

## Part 7: Verify Full Stack

### 7.1 Backend Health Checks

**Terminal 1 (Backend running):**
```bash
# In aurigraph-v11-standalone directory
./mvnw quarkus:dev

# Keep this terminal open
```

**Test all backend endpoints:**
```bash
# Health check
curl http://localhost:9003/q/health

# Platform status
curl http://localhost:9003/api/v11/status

# Authentication endpoint
curl -v -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Expected: 200 OK with Set-Cookie header
```

---

### 7.2 Frontend Connection Test

**Terminal 2 (Frontend running):**
```bash
# In enterprise-portal directory
npm run dev

# Keep this terminal open
```

**Open browser:**
```bash
# macOS
open http://localhost:3000

# Linux
xdg-open http://localhost:3000

# Windows (WSL2)
explorer.exe http://localhost:3000
```

---

### 7.3 Test Authentication Flow

**In browser (http://localhost:3000/login):**

1. **Enter credentials:**
   - Username: `demo`
   - Password: `demo123`

2. **Click "Login"**

3. **Expected behavior:**
   - Login succeeds
   - Redirects to dashboard (/)
   - No CORS errors in console

4. **Verify session cookie:**
   - Press F12 (DevTools)
   - Go to "Application" tab
   - Click "Cookies" > "http://localhost:3000"
   - Verify `session_id` cookie exists

**Success Criteria:**
- ✅ Login works without errors
- ✅ Session cookie appears in browser
- ✅ Dashboard loads successfully
- ✅ No CORS errors in console

---

### 7.4 Test WebSocket Connection

**Install websocat (for testing):**
```bash
# macOS
brew install websocat

# Linux
cargo install websocat

# Or download binary from:
# https://github.com/vi/websocat/releases
```

**Test WebSocket endpoints:**
```bash
# Test transactions WebSocket
websocat ws://localhost:9003/ws/transactions

# Expected: Connection opens, may receive messages
# Press Ctrl+C to close
```

---

## Part 8: IDE Configuration

### 8.1 VS Code Setup (Recommended)

**Install VS Code:**
```bash
# macOS
brew install --cask visual-studio-code

# Linux
sudo snap install code --classic

# Or download from: https://code.visualstudio.com/
```

---

**Install Required Extensions:**
```bash
# Essential Extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-playwright.playwright

# TypeScript Support
code --install-extension ms-vscode.vscode-typescript-next

# Java Support (Backend)
code --install-extension vscjava.vscode-java-pack

# React Support
code --install-extension dsznajder.es7-react-js-snippets

# Git Support
code --install-extension eamodio.gitlens

# Optional but Useful
code --install-extension formulahendry.auto-close-tag
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
```

---

**Create Workspace Settings:**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Create .vscode directory
mkdir -p .vscode

# Create settings.json
cat > .vscode/settings.json <<EOF
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  "typescript.tsdk": "enterprise-portal/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[java]": {
    "editor.defaultFormatter": "redhat.java"
  },

  "java.configuration.runtimes": [
    {
      "name": "JavaSE-21",
      "path": "/opt/homebrew/opt/openjdk@21"
    }
  ],

  "files.exclude": {
    "**/node_modules": true,
    "**/target": true,
    "**/.git": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/target": true,
    "**/dist": true
  }
}
EOF
```

---

**Create Launch Configuration (For Debugging):**
```bash
cat > .vscode/launch.json <<EOF
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "\${workspaceFolder}/enterprise-portal",
      "console": "integratedTerminal"
    },
    {
      "type": "java",
      "request": "launch",
      "name": "Debug Backend (Quarkus)",
      "mainClass": "io.quarkus.runner.GeneratedMain",
      "projectName": "aurigraph-v11-standalone"
    }
  ]
}
EOF
```

---

### 8.2 IntelliJ IDEA Setup (Alternative)

**For Java Backend Development:**

1. **Download IntelliJ IDEA Community Edition:**
   - https://www.jetbrains.com/idea/download/

2. **Open Project:**
   - Open IntelliJ IDEA
   - Click "Open"
   - Select `aurigraph-v11-standalone` directory
   - Wait for Maven import to complete

3. **Configure JDK:**
   - File > Project Structure > Project Settings > Project
   - Set SDK to Java 21
   - Apply and OK

4. **Install Plugins:**
   - File > Settings > Plugins
   - Search and install:
     - Quarkus Tools
     - Lombok
     - GitLens

---

## Part 9: Troubleshooting

### Issue 1: Port Already in Use

**Symptoms:**
```
Port 9003 is already in use
```

**Solution:**
```bash
# Find process using port 9003
lsof -i :9003

# Kill the process
kill -9 <PID>

# Or use a different port in application.properties:
quarkus.http.port=9004
```

---

### Issue 2: Database Connection Failed

**Symptoms:**
```
Unable to create requested service [org.hibernate.engine.jdbc.env.spi.JdbcEnvironment]
```

**Solution:**
```bash
# Verify PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U aurigraph_user -d aurigraph

# If connection fails, check credentials in application.properties
```

---

### Issue 3: Maven Build Fails

**Symptoms:**
```
Failed to execute goal on project aurigraph-v11-standalone
```

**Solution:**
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Verify Java version
java --version  # Must be 21

# Clean build
./mvnw clean install -DskipTests -U
```

---

### Issue 4: npm install Fails

**Symptoms:**
```
EACCES: permission denied
```

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER ~/.npm
sudo chown -R $USER ~/node_modules

# Try again
cd enterprise-portal
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 5: CORS Errors in Browser

**Symptoms:**
```
Access to fetch at 'http://localhost:9003/api/v11/status' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```bash
# Verify CORS configuration in application.properties
grep -A 6 "quarkus.http.cors" src/main/resources/application.properties

# Should show:
# quarkus.http.cors=true
# quarkus.http.cors.origins=http://localhost:3000
# quarkus.http.cors.access-control-allow-credentials=true

# Restart backend after changes
```

---

## Part 10: Post-Setup Verification

### 10.1 Run Full Stack Test

**Terminal 1 (Backend):**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev
```

**Terminal 2 (Frontend):**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
npm run dev
```

**Terminal 3 (Tests):**
```bash
# Test backend
curl http://localhost:9003/q/health

# Test authentication
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Test WebSocket
websocat ws://localhost:9003/ws/transactions
# Press Ctrl+C after 5 seconds
```

---

### 10.2 Verification Checklist

**Backend:**
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200: `curl http://localhost:9003/q/health`
- [ ] Authentication endpoint works: Login returns session cookie
- [ ] WebSocket connects: `websocat ws://localhost:9003/ws/transactions`
- [ ] Database connection works: Check backend logs for "Database connection established"

**Frontend:**
- [ ] Frontend starts without errors
- [ ] Browser opens to http://localhost:3000
- [ ] No TypeScript errors: `npm run build` succeeds
- [ ] No ESLint errors: `npm run lint` passes

**Integration:**
- [ ] Login works with demo/demo123
- [ ] Session cookie appears in browser DevTools
- [ ] No CORS errors in browser console
- [ ] Dashboard loads after successful login

---

## Part 11: Quick Reference Commands

### Backend Commands
```bash
# Navigate to backend
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Start development mode
./mvnw quarkus:dev

# Run tests
./mvnw test

# Build production JAR
./mvnw clean package

# Build native image
./mvnw package -Pnative
```

---

### Frontend Commands
```bash
# Navigate to frontend
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

### Database Commands
```bash
# Connect to database
psql -h localhost -U aurigraph_user -d aurigraph

# List tables
\dt

# Describe table
\d users

# Run query
SELECT * FROM users LIMIT 5;

# Exit
\q
```

---

### Git Commands
```bash
# Check status
git status

# Create feature branch
git checkout -b feature/sprint-20-your-feature

# Stage changes
git add .

# Commit changes
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/sprint-20-your-feature

# Pull latest changes
git pull origin main
```

---

## Part 12: Next Steps

### Immediate Actions
1. **Verify Setup:** Complete Part 10 verification checklist
2. **Test Features:** Login, logout, API calls, WebSocket connection
3. **Read Documentation:**
   - `SPRINT-20-KICKOFF-CHECKLIST.md`
   - `PHASE-1-IMPLEMENTATION-CHECKLIST.md`
   - `SPRINT-20-PORTAL-INTEGRATION-PLAN.md`

### Join Team Communication
1. **Slack/Teams:** Join Sprint 20 channel
2. **JIRA:** Get access to AV11 project board
3. **GitHub:** Ensure you have write access to repository

### Start Development
1. **Choose Task:** Pick task from PHASE-1-IMPLEMENTATION-CHECKLIST.md
2. **Create Branch:** `git checkout -b feature/sprint-20-<task-name>`
3. **Start Coding:** Follow implementation checklist step-by-step
4. **Daily Standups:** Report progress daily

---

## Support & Resources

### Documentation
- **Sprint 20 Plan:** `SPRINT-20-PORTAL-INTEGRATION-PLAN.md`
- **Backend README:** `README.md` (backend root)
- **Frontend README:** `enterprise-portal/README.md`
- **API Docs:** `ENTERPRISE-PORTAL-README.md`

### External Resources
- **Quarkus Docs:** https://quarkus.io/guides/
- **React Docs:** https://react.dev/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **Vite Docs:** https://vitejs.dev/guide/

### Getting Help
- **Technical Issues:** Post in Sprint 20 Slack channel
- **Backend Questions:** Contact Full-Stack developer (Developer 3)
- **Frontend Questions:** Contact Frontend Lead (Developer 1)
- **Git/DevOps Issues:** Contact DevOps team

---

**END OF DEVELOPMENT ENVIRONMENT SETUP GUIDE**

**Estimated Time to Complete:** 30-60 minutes
**Next Document:** `SPRINT-20-KICKOFF-CHECKLIST.md` (Pre-sprint verification)
