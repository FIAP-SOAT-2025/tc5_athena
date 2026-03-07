resource "kubectl_manifest" "db_migrate_job" {
  depends_on = [kubectl_manifest.secrets, kubectl_manifest.configmap, kubernetes_secret.dockerhub_secret]
  wait       = true
  force_new  = true
  yaml_body  = <<YAML
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate-seed-job
  namespace: tc5-athena
spec:
  template:
    spec:
      imagePullSecrets:
      - name: dockerhub-secret
      containers:
      - name: tc5-athena-migrate-db
        image: dianabianca/tc5-athena:latest
        imagePullPolicy: Always
        command: ["sh", "-c", "npx prisma migrate deploy"]
        envFrom:
        - configMapRef:
            name: api-configmap
        - secretRef:
            name: api-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
      restartPolicy: Never
  backoffLimit: 4

YAML
}