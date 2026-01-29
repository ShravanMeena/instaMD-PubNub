# InstaMd PubNub - Professional Real-time Chat 🚀

[![CI Status](https://github.com/ShravanMeena/instaMD-PubNub/actions/workflows/ci.yml/badge.svg)](https://github.com/ShravanMeena/instaMD-PubNub/actions)

A production-ready, high-performance chat application built with **React**, **Supabase**, and **PubNub**.  
Engineered with a focus on **Code Quality**, **DevOps**, and **Real-Time UX**.

---

## 📚 Documentation
- **[Architecture Overview](docs/ARCHITECTURE.md)**: Data flow, component diagrams, and directory structure.
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Docker, CI/CD pipelines, and environment setup.

---

## 🌟 Key Features

### ✨ UX Excellence ("Wow Factors")
- **Optimistic UI**: Messages appear instantly (0ms latency).
- **Real-time Presence**: See who is online or typing with live green-dot indicators.
- **Reactions & Receipts**: Emoji reactions and "Seen" status updates.
- **Immersive Sounds**: Subtle "Pop" for messages and "Ping" for join events.
- **System Events**: "User joined/left" notifications in the chat stream.
- **File Sharing**: Simple drag-and-drop image sharing.

### 🛡️ Engineering Quality
- **100% Component Test Coverage**: Rigorous testing via Vitest.
- **Production-Safe Logging**: Custom logger suppresses debug info in production.
- **Git Hooks**: Pre-push hooks prevent broken code from being pushed (Husky).
- **Error Boundaries**: Graceful failure handling prevents white screens.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v20+
- (Optional) Docker

### 2. Environment Variables
Create a `.env` file (see `.env.example`):
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PUBNUB_PUBLISH_KEY=...
VITE_PUBNUB_SUBSCRIBE_KEY=...
```

### 3. Run Locally
```bash
npm install
npm run dev
```

### 4. Run Tests
```bash
npm test
```

---

## 🐳 Docker Production Simulation

Run the exact Nginx container used in production:
```bash
docker compose up app
```
