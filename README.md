# Dex OIDC Example

Golang backend + TanStack frontend demonstrating OIDC flow with Dex.

## DEMO

<video width="320" height="240" controls>
  <source src="./media/dexLogin.mp4" type="video/mp4">
</video>

## Prerequisites

- Docker
- Kind
- Kubectl
- Helm
- Helmfile

## Installation

./deploy-all.sh

## Access

- Frontend: <http://localhost:8000>
- Backend: <http://localhost:8000/api/auth>
- Dex: <http://localhost:8000/v1/dex>

## Redeploy

After code changes, run respective `./deploy.sh` scripts from backend/frontend folders.

## Cleanup

```bash
kind delete cluster --name kong-dex
```
