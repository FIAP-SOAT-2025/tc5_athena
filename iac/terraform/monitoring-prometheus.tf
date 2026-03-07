resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "25.11.0"

  # Desabilita componentes que não precisamos para simplificar
  set {
    name  = "alertmanager.enabled"
    value = "false"
  }

  set {
    name  = "prometheus-pushgateway.enabled"
    value = "false"
  }

  #coleta métricas de todos os pods/nodes
  set {
    name  = "server.persistentVolume.enabled"
    value = "false"
  }

  set {
    name  = "server.service.type"
    value = "ClusterIP"
  }

  depends_on = [kubernetes_namespace.monitoring]
}
