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


## Posibles Mejoras del Proyecto

Esta sección describe áreas potenciales de mejora para el proyecto Task Manager. Si deseas contribuir o mejorar el proyecto, considera abordar alguno de los siguientes puntos:

### Kubernetes (k8s)

1.  **Uso de Namespaces:**
    *   Actualmente, la mayoría de los recursos están en el namespace `default`. Considera usar namespaces dedicados (ej. `task-manager-api`, `task-manager-frontend`, `monitoring`, `auth`, `database`) para una mejor organización, aplicación de políticas y control de acceso.

2.  **Gestión de Secretos y Credenciales:**
    *   **Keycloak:** Las credenciales de administrador (`admin`/`admin123`) en `k8s/auth/keycloak-deployment.yaml` son las predeterminadas y deben cambiarse por unas más seguras, especialmente para producción.
    *   **Grafana:** Similarmente, las credenciales de administrador (`admin`/`admin123`) en `k8s/monitoring/grafana-deployment.yaml` deben cambiarse.
    *   **OAuth2 Proxy:** El `client-secret` en `k8s/auth/oauth2-proxy-secret.yaml` necesita ser actualizado con el secreto real del cliente Keycloak.
    *   Para una gestión de secretos más robusta en producción, se podría explorar el uso de herramientas como HashiCorp Vault o Sealed Secrets.

3.  **Configuración de Producción para Keycloak:**
    *   El `keycloak-deployment.yaml` usa `start-dev`. Para producción, Keycloak recomienda una configuración diferente, usualmente con una base de datos externa (PostgreSQL, MySQL, etc.) en lugar de la base de datos H2 embebida.

4.  **NetworkPolicies:**
    *   Implementar `NetworkPolicy` para mejorar la seguridad a nivel de red dentro del clúster, definiendo explícitamente qué pods pueden comunicarse entre sí.

5.  **ImagePullPolicy:**
    *   En `k8s/api/deployment.yaml` y `k8s/frontend/deployment.yaml`, `imagePullPolicy` está como `Never`. Para producción o al usar un registro de imágenes, considerar cambiarlo a `IfNotPresent` o `Always` (usando etiquetas de imagen específicas en lugar de `latest`).

### API (Node.js/Express)

1.  **Conexión a MongoDB:**
    *   En `api/routes.js`, `mongoose.connect()` se llama repetidamente. Es mejor establecer la conexión a MongoDB una vez cuando la aplicación se inicia (ej. en `api/index.js`).

2.  **Validación de Entradas:**
    *   Agregar validación para los datos de entrada en las rutas (ej. `req.body`, `req.params`, `req.query`) usando bibliotecas como `joi` o `express-validator`.

3.  **Métrica `activeTasks`:**
    *   La métrica `activeTasks` en `api/metrics.js` no parece actualizarse dinámicamente. Implementar la lógica para incrementar/decrementar este gauge según las operaciones de tareas.

### Frontend (React)

1.  **Gestión de Web Workers:**
    *   En `Frontend/src/App.js`, la inicialización y gestión del worker (`initializeWorker`) podría llevar a la creación de múltiples instancias. Revisar esta lógica para asegurar una gestión eficiente del worker.

2.  **Pruebas (Testing):**
    *   Expandir las pruebas en `Frontend/src/App.test.js` para cubrir más componentes, interacciones de usuario y lógica de la aplicación.

### General

1.  **Pipeline de CI/CD:**
    *   Configurar un pipeline de Integración Continua/Despliegue Continuo (CI/CD) utilizando herramientas como GitHub Actions, GitLab CI, Jenkins, etc., para automatizar la construcción, prueba y despliegue.

