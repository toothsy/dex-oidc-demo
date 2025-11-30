#!/bin/bash
set -e

CLUSTER_NAME="kong-dex"
kind create cluster --name ${CLUSTER_NAME} --config deployments/kind-config.yaml
echo "=== Building and loading Docker images ==="

# Build and load frontend image
echo "Building frontend image..."
cd "./frontend"
docker build -t dex-frontend:latest .
echo "Loading frontend image into kind cluster..."
kind load docker-image dex-frontend:latest --name $CLUSTER_NAME

# Build and load backend image
echo "Building backend image..."
cd "../backend"
docker build -t backend-auth:latest .
echo "Loading backend image into kind cluster..."
kind load docker-image backend-auth:latest --name $CLUSTER_NAME

echo "=== Deploying infrastructure and applications via helmfile ==="
cd "../deployments/"
helmfile sync

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Pod status across all namespaces:"
kubectl get pods -A | grep -E "(NAMESPACE|postgres|kong|auth|frontend)"
