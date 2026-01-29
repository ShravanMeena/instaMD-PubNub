# System Architecture

## Overview
InstaMd is a real-time chat application designed for high availability and instant responsiveness. It leverages a hybrid architecture:

- **State & Identity**: Managed by [Supabase](https://supabase.com/) (PostgreSQL + Auth).
- **Real-time Event Bus**: Managed by [PubNub](https://www.pubnub.com/) (Messages, Presence, Signals).
- **Frontend**: React 18 with Vite.

## Component Diagram

```mermaid
graph TD
    User[User Client] -->|Auth & Data| Supabase[Supabase (DB/Auth)]
    User -->|Real-time Events| PubNub[PubNub Network]
    
    subgraph PubNub Channels
        C1[Chat Channel]
        P1[Global Presence]
    end
    
    PubNub -->|Messages/Signals| C1
    PubNub -->|HereNow/State| P1
```

## Data Flow

### 1. Messaging (Optimistic UI)
1. User types a message and hits send.
2. **Local**: App immediately adds the message to the React State with a `pending` status. 
3. **Network**: App publishes the message to `PubNub`.
    - **Success**: Status updates to `sent`.
    - **Fail**: Status updates to `error`.
4. **Deduping**: The app listens to the message stream. If it receives its own message back from PubNub, it ignores it (deduping) or updates the timestamp/status.

### 2. Presence System
- **Global Channel**: All users subscribe to `global-presence-v1`.
- **State**: Users broadcast their state (`{ name, id, avatar }`) upon joining.
- **Heartbeat**: PubNub automatically handles heartbeats.
- **Hook**: `usePresence.js` handles the complex logic of:
    - Initial `HereNow` fetch (who is already there?).
    - `Join/Leave/Timeout` event listeners.
    - Interval polling (fail-safe for missed packets).

## Directory Structure
```
src/
├── features/
│   ├── auth/          # Login, Registration, Session
│   └── chat/          # Main chat domain
│       ├── components/# Visual components (MessageList, Sidebar)
│       ├── hooks/     # Business logic (useMessages, usePresence)
│       └── __tests__/ # Unit tests
├── context/           # React Context (Global State)
├── lib/               # Singletons (PubNub client, Supabase client)
└── utils/             # Helpers (Logger, Date Formatting)
```

## Logging Strategy
We use a custom `utils/logger.js` that wraps `console` methods.
- **Development**: Logs are visible.
- **Production**: Logs are suppressed to prevent data leaks and improve performance.
