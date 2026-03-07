resource "kubernetes_namespace" "athena_ns" {
  metadata {
    name = "tc5-athena"
  }
}