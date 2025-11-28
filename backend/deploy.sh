#!/bin/bash
set -e

IMAGE_NAME="backend-auth"
TAG="latest"
CLUSTER_NAME="kong-dex"

echo "Building $IMAGE_NAME:$TAG..."
docker build -t $IMAGE_NAME:$TAG .

echo "Loading image into Kind cluster $CLUSTER_NAME..."
kind load docker-image $IMAGE_NAME:$TAG --name $CLUSTER_NAME

echo "Restarting deployment..."
kubectl rollout restart deployment/backend -n auth

echo "Waiting for rollout to complete..."
kubectl rollout status deployment/backend -n auth

echo "Deployment complete!"
kubectl get pods -n auth
