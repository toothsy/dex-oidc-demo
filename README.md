# Dex OIDC Example

Golang backend + TanStack frontend demonstrating OIDC flow with Dex.

## Prerequisites

- Docker
- Kind
- Kubectl
- Helmfile

## Installation

### 1. Create Kind cluster

```bash
kind create cluster --name kong-dex --config deployments/kind-config.yaml
```

### 2. Deploy infrastructure

```bash
cd deployments
helmfile apply
```

This installs Kong, PostgreSQL, Dex, backend, and frontend.

### 3. Deploy backend

```bash
cd backend
./deploy.sh
```

### 4. Deploy frontend

```bash
cd frontend
./deploy.sh
```

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
