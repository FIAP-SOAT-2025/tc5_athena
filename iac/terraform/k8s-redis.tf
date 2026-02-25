resource "kubectl_manifest" "redis_deployment" {
  depends_on = [kubernetes_namespace.athena_ns]

  yaml_body = <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: tc5-athena
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
YAML
}

resource "kubectl_manifest" "redis_service" {
  depends_on = [kubectl_manifest.redis_deployment]

  yaml_body = <<YAML
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: tc5-athena
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
YAML
}
