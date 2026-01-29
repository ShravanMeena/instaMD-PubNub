# Deployment Guide

This application is designed to be deployed as a containerized application or as a static site (if Nginx is removed).

## 🐳 Docker Deployment (Recommended)

The project includes a multi-stage `Dockerfile` optimized for production.

### Build and Run
```bash
# Build the image
docker build -t instamd-chat .

# Run the container
docker run -p 8080:80 \
  -e VITE_SUPABASE_URL=... \
  -e VITE_SUPABASE_ANON_KEY=... \
  -e VITE_PUBNUB_PUBLISH_KEY=... \
  -e VITE_PUBNUB_SUBSCRIBE_KEY=... \
  instamd-chat
```

### Docker Compose
For easier orchestration, use `docker-compose.yml`:
```bash
docker compose up app
```

## 🛡️ Safety Hooks (Husky)

We enforce quality checks before code leaves your machine.

- **Pre-Push Hook**: Automatically runs `npm test`.
    - If tests pass: Push proceeds.
    - If tests fail: Push is blocked.

To bypass (emergency only): `git push --no-verify`

## 🚀 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) handles automation.

### Environments
1. **Staging**: Triggered by push to `develop`.
2. **Production**: Triggered by push to `main`.

### Secrets Required
You must verify these secrets are set in your GitHub Repository Settings:

| Secret Name | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Key |
| `VITE_PUBNUB_PUBLISH_KEY` | PubNub Publish Key |
| `VITE_PUBNUB_SUBSCRIBE_KEY` | PubNub Subscribe Key |

## 📦 Manual Build (Static)

If you prefer to host on Vercel, Netlify, or S3:

1. **Build**:
   ```bash
   npm run build
   ```
2. **Output**:
   The `dist/` folder will contain the static assets.
3. **Serve**:
   Point your web server to `dist/index.html`. Ensure "SPA Routing" (rewrite all 404s to index.html) is enabled.
