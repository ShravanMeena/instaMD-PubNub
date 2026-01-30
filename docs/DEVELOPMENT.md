# Developer Guide

## 🛠️ Local Development Setup

### Prerequisites
- Node.js v20+
- npm v10+

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

---

## 🧪 Testing & Quality Assurance

We maintain a high standard of code quality using automated tools.

### Running Tests
To run the full test suite (Vitest):
```bash
npm test
```

To run tests in watch mode during development:
```bash
npm test -- --watch
```

### 🛡️ Git Hooks (Husky)
We use **Husky** to enforce quality checks before code is pushed.

- **Pre-Push Hook**: Automatically runs `npm test` before `git push`.
    - 🚦 **Pass**: Code is pushed to the remote.
    - 🛑 **Fail**: Push is blocked until tests pass.
    - *Bypass (Not Recommended)*: `git push --no-verify`

---

## 🏗️ Project Structure
- **`src/features/`**: Feature-based modules (Auth, Chat, etc.)
- **`src/components/ui/`**: Reusable UI components (Shadcn/UI)
- **`src/lib/`**: Core libraries (PubNub, Utils)
