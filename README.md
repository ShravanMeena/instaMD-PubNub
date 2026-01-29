# InstaMd PubNub - Professional Real-time Chat 🚀

A production-ready, high-performance chat application built with **React**, **Supabase**, and **PubNub**.
Engineered with a focus on **Code Quality**, **DevOps**, and **Real-Time UX**.

![CI Status](https://github.com/ShravanMeena/instaMD-PubNub/actions/workflows/ci.yml/badge.svg)

---

## 🌟 Key Features

### ✨ UX Excellence ("Wow Factors")
- **Optimistic UI**: Messages appear instantly (0ms latency) with local temporary states.
- **Offline Resilience**: Visual indicators when network connection drops or reconnects.
- **Typing Indicators**: Real-time feedback when other users are typing.
- **Presence**: Live "Online" status updates for users.
- **File Sharing**: Integrated image/file sharing capabilities.

### 🛡️ Engineering & Quality
- **100% Component Test Coverage**: Comprehensive Unit Tests using **Vitest** & **React Testing Library**.
- **Safety Hooks**: `predev` and `prebuild` scripts ensure no broken code is ever run or built.
- **Strict Linting**: ESLint configuration for code consistency.
- **Secure Handling**: Environment variables protected and not committed (Secrets Management).

### 🏗️ Infrastructure & DevOps
- **Dockerized**: Multi-stage build (`builder` -> `runner` Nginx Alpine) for optimal production size.
- **Orchestration**: `docker-compose.yml` for easy local development and environment simulation.
- **CI/CD Pipeline**: GitHub Actions workflow splitting **Staging (`develop`)** and **Production (`main`)**.
    - **Staging**: Deploys with Test Keys.
    - **Production**: Deploys with Live Keys.
    - **Automated Checks**: Lint, Test, and Build verification on every push.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **State Management**: Context API + Custom Hooks
- **Real-time**: PubNub SDK (Messaging, Presence, Signals)
- **Backend**: Supabase (Auth, DB, Storage)
- **Testing**: Vitest, JSDOM, React Testing Library
- **DevOps**: Docker, Nginx, GitHub Actions

---

## 🚀 Getting Started

### 1. Prerequisites
- Docker Engine (optional, for container mode)
- Node.js v20+

### 2. Environment Setup
Create a `.env` file in the root directory (use `.env.example` as a template):
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_PUBNUB_PUBLISH_KEY=your_key
VITE_PUBNUB_SUBSCRIBE_KEY=your_key
```

### 3. Running Locally (Development)
The development server includes safety checks (tests run before start).
```bash
npm install
npm run dev
```

### 4. Running with Docker (Production Simulation)
Build and serve the production-optimized Nginx container locally.
```bash
# Production Profile
docker compose up app

# Development Profile (Hot Reload inside Docker)
docker compose up dev
```

---

## 🧪 Testing Strategy

We maintain a high bar for code quality.

```bash
# Run all unit tests
npm run test

# Run tests with UI
npm run test -- --ui

# Check coverage
npm run test -- --coverage
```

**Architecture Note**: Tests are co-located in `__tests__` directories within each feature for better maintainability (e.g., `src/features/chat/components/__tests__/`).

---

## 📦 Deployment pipeline

The repository follows a strict GitFlow-like process:

| Branch | Environment | Secrets Used | Trigger |
| :--- | :--- | :--- | :--- |
| **`develop`** | **Staging** | `STAGING_PUBNUB_...` | Push to `develop` |
| **`main`** | **Production** | `PROD_PUBNUB_...` | Push to `main` |

**Verification**:
The CI pipeline (`.github/workflows/ci.yml`) automatically:
1. Installs Dependencies
2. Lints Code
3. Runs Unit Tests
4. Builds the Application
5. Verifies Docker Build (Dry Run)

---

## 📂 Project Structure

```
src/
├── features/          # Domain-driven design (Auth, Chat)
│   ├── auth/          
│   └── chat/          
│       ├── components/    # Feature-specific UI
│       ├── hooks/         # Logic hooks (useMessages, usePresence)
│       └── __tests__/     # Co-located tests
├── components/        # Shared UI (ShadowCN, etc)
├── context/           # Global State (Auth, Chat)
├── layouts/           # Page Containers
└── lib/               # Core Config (PubNub, Supabase)
```
