resource "kubernetes_service" "api_service" {
  metadata {
    name      = "api-service"
    namespace = "tc5-athena"
    annotations = {
      "service.beta.kubernetes.io/aws-load-balancer-type" = "nlb"
    }
  }
  spec {
    selector = {
      app = "tc5-athena-api"
    }
    port {
      protocol    = "TCP"
      port        = 80
      target_port = 3000
    }
    type = "LoadBalancer"
  }
  depends_on = [kubernetes_namespace.athena_ns]
}

resource "kubernetes_service" "api_service_internal" {
  metadata {
    name      = "api-service-internal"
    namespace = "tc5-athena"
  }
  spec {
    selector = {
      app = "tc5-athena-api"
    }
    port {
      protocol    = "TCP"
      port        = 80
      target_port = 3000
    }
    type = "ClusterIP"
  }
  depends_on = [kubernetes_namespace.athena_ns]
}
