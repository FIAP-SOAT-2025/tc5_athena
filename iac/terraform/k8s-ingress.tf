resource "kubernetes_ingress_v1" "api_ingress" {
  metadata {
    name      = "api-ingress"
    namespace = "tc5-athena"
    annotations = {
      "kubernetes.io/ingress.class" : "alb",
      "alb.ingress.kubernetes.io/scheme" : "internal",
      "alb.ingress.kubernetes.io/target-type" : "ip"
    }
  }

  spec {
    rule {
      http {
        path {
          path      = "/*"
          path_type = "ImplementationSpecific"
          backend {
            service {
              name = kubernetes_service.api_service.metadata[0].name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [kubernetes_namespace.athena_ns]
}