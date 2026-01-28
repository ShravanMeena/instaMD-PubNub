# InstaMd PubNub - Real-time Messaging App

A modern, production-ready chat application built with **React**, **Supabase**, and **PubNub**.

## 🚀 Features

- **Authentication**: Secure login/signup via Supabase Auth.
- **Real-time Messaging**: Instant message delivery using PubNub.
- **Channels**: Create and join public channels.
- **Direct Messages (1:1)**: Private conversations with other users.
- **Presence**: See who is online in real-time.
- **File Sharing**: Upload and share images.
- **Typing Indicators**: See when others are typing.
- **Modern UI**: Polished interface using Tailwind CSS and Shadcn UI.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **UI Library**: Shadcn UI (Radix Primitives)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Real-time Engine**: PubNub (Messaging, Presence)
- **State Management**: React Context + Hooks

---

## 📦 Architecture & Folder Structure

The project follows a scalable feature-based architecture:

```
src/
├── features/          # Feature-specific code (Auth, Chat)
│   ├── auth/          # Login, Signup, Auth Hooks
│   └── chat/          # Chat Components, Hooks, Context
├── components/        # Reusable UI components
│   ├── ui/            # Shadcn UI primitives (Button, Dialog, etc.)
│   └── common/        # App-wide common components
├── context/           # Global Context Providers (AuthContext)
├── hooks/             # Shared custom hooks
├── lib/               # Utility functions & SDK initializations
└── layouts/           # Page layouts (ChatLayout)
```

---

## ⚡️ Getting Started

### 1. Prerequisites

- Node.js (v16+)
- npm or yarn

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add your credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PUBNUB_PUBLISH_KEY=your_pubnub_publish_key
VITE_PUBNUB_SUBSCRIBE_KEY=your_pubnub_subscribe_key
```

### 4. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🧪 Testing

To run the test suite (if configured):

```bash
npm run test
```

## 📝 Assessment Notes

- **Refactoring**: Key logic is abstracted into custom hooks (`useChannels`, `useMessages`, `useUsers`) for better separation of concerns.
- **Reusability**: UI components like `ConfirmDialog` and `UserProfileDialog` are modular and reusable across the app.
- **Security**: Row Level Security (RLS) policies in Supabase ensure users can only access data they are permitted to see.
