#!/bin/bash
set -e

IMAGE_NAME="dex-frontend"
TAG="latest"
CLUSTER_NAME="kong-dex"

echo "Building $IMAGE_NAME:$TAG..."
docker build -t $IMAGE_NAME:$TAG .

echo "Loading image into Kind cluster $CLUSTER_NAME..."
kind load docker-image $IMAGE_NAME:$TAG --name $CLUSTER_NAME

echo "Restarting deployment..."
kubectl rollout restart deployment/frontend -n frontend

echo "Waiting for rollout to complete..."
kubectl rollout status deployment/frontend -n frontend

echo "Deployment complete!"
kubectl get pods -n frontend
