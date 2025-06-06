# Task Manager Deployment Guide

This document provides instructions to deploy the Task Manager application to a Kubernetes cluster.

## Prerequisites

*   A running Kubernetes cluster.
*   `kubectl` command-line tool configured to communicate with your cluster.
*   An Ingress controller (like NGINX Ingress Controller) installed in your cluster if you plan to use Ingress resources.
*   Host entries in your local `/etc/hosts` file (or equivalent for your OS) for the services if you are testing locally:
    *   `task-manager.local`
    *   `task-manager-api.local`
    *   `auth.local`
    *   `keycloak.local`
    *   `prometheus.local`
    *   `grafana.local`
    (These should point to your Ingress controller's external IP address).

## Deployment Steps

The deployment is managed using Kustomize.

### 1. Build Docker Images

Before deploying, you need to build the Docker images for the API and Frontend if they are not already available in a registry accessible by your Kubernetes cluster. 

**API Image:**
Navigate to the `api` directory and build the image:
```sh
cd api
docker build -t task-manager-api:latest .
cd ..
```

**Frontend Image:**
Navigate to the `Frontend` directory and build the image:
```sh
cd Frontend
docker build -t task-manager-frontend:latest .
cd ..
```

### 2. Apply Kubernetes Configurations

Navigate to the `k8s` directory. The main Kustomization file ([k8s/kustomization.yaml](k8s/kustomization.yaml)) references all other components.

```sh
cd k8s
```

#### a. Deploy Persistent Volumes
These are defined in [k8s/persistent-volumes.yaml](k8s/persistent-volumes.yaml).
```sh
kubectl apply -f persistent-volumes.yaml
```

#### b. Deploy MongoDB
MongoDB resources are defined in the [k8s/mongo/](k8s/mongo/) directory.
```sh
kubectl apply -k mongo/
```
Wait for MongoDB to be ready before proceeding to the next steps. You can check the status with:
```sh
kubectl get pods -l app=mongo -n default
```

#### c. Deploy API
The API resources are defined in the [k8s/api/](k8s/api/) directory.
```sh
kubectl apply -k api/
```
Check the status:
```sh
kubectl get pods -l app=task-manager-api -n default
```

#### d. Deploy Frontend
The Frontend resources are defined in the [k8s/frontend/](k8s/frontend/) directory.
```sh
kubectl apply -k frontend/
```
Check the status:
```sh
kubectl get pods -l app=task-manager-frontend -n default
```

#### e. Deploy Authentication Services (Keycloak & OAuth2 Proxy)
Authentication resources are defined in the [k8s/auth/](k8s/auth/) directory.
```sh
kubectl apply -k auth/
```
Check the status:
```sh
kubectl get pods -l app=keycloak -n default
kubectl get pods -l app=oauth2-proxy -n default
```
**Note:** Keycloak might take a few minutes to start up and import the realm.

#### f. Deploy Monitoring Services (Prometheus & Grafana)
Monitoring resources are defined in the [k8s/monitoring/](k8s/monitoring/) directory.
```sh
kubectl apply -k monitoring/
```
Check the status:
```sh
kubectl get pods -l app=prometheus -n default
kubectl get pods -l app=grafana -n default
```

### 3. Full Deployment (Alternative)

Alternatively, you can deploy all components at once from the `k8s` directory using the root [k8s/kustomization.yaml](k8s/kustomization.yaml):

```sh
cd k8s
kubectl apply -k .
```
Ensure `persistent-volumes.yaml` is applied first or that your cluster can dynamically provision PersistentVolumes if you remove `storageClassName: manual` and the `persistent-volumes.yaml` file.

## Accessing Services

Once all pods are running and services are exposed (likely via Ingress), you can access them using the hostnames defined in the Ingress rules:

*   **Task Manager Frontend:** `http://task-manager.local`
*   **Task Manager API:** `http://task-manager-api.local` (e.g., `http://task-manager-api.local/api/tasks`)
*   **Authentication (OAuth2 Proxy):** `http://auth.local`
*   **Keycloak Admin Console:** `http://keycloak.local` (Credentials: admin / admin123 as per [k8s/auth/keycloak-deployment.yaml](k8s/auth/keycloak-deployment.yaml))
*   **Prometheus:** `http://prometheus.local`
*   **Grafana:** `http://grafana.local` (Credentials: admin / admin123 as per [k8s/monitoring/grafana-deployment.yaml](k8s/monitoring/grafana-deployment.yaml))

## Troubleshooting

*   Use `kubectl get pods -n default` to check the status of all pods.
*   Use `kubectl logs <pod-name> -n default` to view logs for a specific pod.
*   Use `kubectl describe pod <pod-name> -n default` to get more details about a pod's state.
*   Ensure your Ingress controller is running and configured correctly.
*   Verify that PersistentVolumeClaims have successfully bound to PersistentVolumes (`kubectl get pvc -n default` and `kubectl get pv`).

## Teardown

To remove all deployed resources, you can use `kubectl delete -k` for each component in reverse order of deployment, or delete them all using the root kustomization:

```sh
cd k8s
kubectl delete -k .
kubectl delete -f persistent-volumes.yaml # If you applied it separately
```
This will remove all resources defined in the kustomization files but not the PersistentVolume data itself (due to `persistentVolumeReclaimPolicy: Retain`). You'll need to manually delete the data on the host paths if desired.
