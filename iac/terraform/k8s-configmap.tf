resource "kubectl_manifest" "configmap" {
  depends_on = [kubernetes_namespace.athena_ns]
  yaml_body  = <<YAML
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-configmap
  namespace: tc5-athena
data:
  NODE_TLS_REJECT_UNAUTHORIZED: "0"

YAML
}