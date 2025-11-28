# Dex Auth Frontend

React + Vite + TypeScript frontend for Dex OIDC authentication.

## Features

- OAuth2 Authorization Code Flow with Dex
- Custom purple-themed UI
- Popup-based authentication flow
- Protected routes
- Session management

## Development

```bash
# Install dependencies
npm install

# Run dev server on port 8081
npm run dev

# Build for production
npm run build
```

## Environment

- **Dev URL**: http://localhost:8081
- **OAuth Client ID**: local-client
- **Redirect URI**: http://localhost:8081/oidc/callback
- **Dex Issuer**: http://localhost:8000/v1/dex

## Demo Credentials

- Email: `admin-dex@example.com`
- Password: `password`

## Routes

- `/` - Landing page
- `/login` - Custom login form
- `/oidc/callback` - OAuth callback handler
- `/protected` - Protected resource (requires auth)

## Build & Deploy

```bash
# Build Docker image
docker build -t dex-frontend:latest .

# Deploy with Helmfile
cd ../deployments
helmfile -l name=frontend apply
```

## Architecture

- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Router**: React Router DOM
- **Auth**: Custom OAuth2 client (no external libs)
- **Production**: Nginx serving static files
