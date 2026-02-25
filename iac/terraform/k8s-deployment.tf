resource "kubectl_manifest" "deployment" {
  depends_on = [
    kubernetes_namespace.athena_ns,
    kubectl_manifest.db_migrate_job,
    kubectl_manifest.secrets,
    kubectl_manifest.configmap,
    kubectl_manifest.redis_service
  ]

  override_namespace = "tc5-athena"
  wait               = true
  wait_for_rollout   = true

  timeouts {
    create = "15m"
  }

  yaml_body = <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tc5-athena-api
  namespace: tc5-athena
spec:
  progressDeadlineSeconds: 900
  replicas: 1
  selector:
    matchLabels:
      app: tc5-athena-api
  template:
    metadata:
      labels:
        app: tc5-athena-api
    spec:
      containers:
      - name: tc5-athena-api
        image: dianabianca/tc5-athena:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
          failureThreshold: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
          failureThreshold: 6
        envFrom:
        - configMapRef:
            name: api-configmap
        - secretRef:
            name: api-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

YAML
}