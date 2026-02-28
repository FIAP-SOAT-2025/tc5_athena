resource "kubernetes_config_map" "grafana_dashboards" {
  metadata {
    name      = "grafana-dashboards"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      grafana_dashboard = "1"
    }
  }

  data = {
    "api-dashboard.json"    = file("${path.module}/../../monitoring/grafana/dashboards/api-dashboard.json")
    "aws-s3.json"           = file("${path.module}/../../monitoring/grafana/dashboards/aws-s3.json")
    "postgre-sql.json"      = file("${path.module}/../../monitoring/grafana/dashboards/postgre-sql.json")
    "system-overview.json"  = file("${path.module}/../../monitoring/grafana/dashboards/system-overview.json")
  }

  depends_on = [kubernetes_namespace.monitoring]
}

resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "7.3.7"

  set {
    name  = "adminUser"
    value = var.grafana_admin_user
  }

  set_sensitive {
    name  = "adminPassword"
    value = var.grafana_admin_password
  }

  set {
    name  = "datasources.datasources\\.yaml.apiVersion"
    value = "1"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].name"
    value = "Prometheus"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].type"
    value = "prometheus"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].url"
    value = "http://prometheus-server.monitoring.svc.cluster.local"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].isDefault"
    value = "true"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[1].name"
    value = "CloudWatch"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[1].type"
    value = "cloudwatch"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[1].jsonData.defaultRegion"
    value = "us-east-1"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[1].jsonData.authType"
    value = "keys"
  }

  set_sensitive {
    name  = "datasources.datasources\\.yaml.datasources[1].secureJsonData.accessKey"
    value = var.aws_access_key_id
  }

  set_sensitive {
    name  = "datasources.datasources\\.yaml.datasources[1].secureJsonData.secretKey"
    value = var.aws_secret_access_key
  }

  set_sensitive {
    name  = "env.AWS_SESSION_TOKEN"
    value = var.aws_session_token
  }

  set {
    name  = "service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "persistence.enabled"
    value = "false"
  }

  set {
    name  = "sidecar.dashboards.enabled"
    value = "true"
  }

  set {
    name  = "sidecar.dashboards.label"
    value = "grafana_dashboard"
  }

  depends_on = [helm_release.prometheus, kubernetes_config_map.grafana_dashboards]
}
