locals {
  db_host_resolved = var.db_host != "" ? var.db_host : data.aws_db_instance.athena[0].address
}

data "aws_db_instance" "athena" {
  count                  = var.db_host == "" ? 1 : 0
  db_instance_identifier = "${var.projectName}-v1-postgres-db-v1"
}

resource "kubernetes_namespace" "athena" {
  metadata {
    name = "tc5-athena"
  }
}

resource "kubernetes_secret" "dockerhub" {
  metadata {
    name      = "dockerhub-secret"
    namespace = kubernetes_namespace.athena.metadata[0].name
  }

  type = "kubernetes.io/dockerconfigjson"

  data = {
    ".dockerconfigjson" = jsonencode({
      auths = {
        "https://index.docker.io/v1/" = {
          username = var.dockerhub_username
          password = var.dockerhub_password
          auth     = base64encode("${var.dockerhub_username}:${var.dockerhub_password}")
        }
      }
    })
  }
}

resource "kubernetes_secret" "api_env" {
  metadata {
    name      = "api-env-secret"
    namespace = kubernetes_namespace.athena.metadata[0].name
  }

  data = {
    DATABASE_URL          = "postgresql://${var.db_user}:${var.db_password}@${local.db_host_resolved}:5432/${var.db_name}?schema=public"
    JWT_SECRET            = var.jwt_secret
    AWS_ACCESS_KEY_ID     = var.aws_access_key_id
    AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
    AWS_SESSION_TOKEN     = var.aws_session_token
  }
}

resource "kubernetes_deployment" "api" {
  metadata {
    name      = "tc5-athena-api"
    namespace = kubernetes_namespace.athena.metadata[0].name
    labels = {
      app = "tc5-athena-api"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "tc5-athena-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "tc5-athena-api"
        }
      }

      spec {
        image_pull_secrets {
          name = kubernetes_secret.dockerhub.metadata[0].name
        }

        init_container {
          name    = "db-migrate"
          image   = "${var.dockerhub_username}/tc5-athena:latest"
          command = ["npx", "prisma", "migrate", "deploy"]

          env {
            name = "DATABASE_URL"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_env.metadata[0].name
                key  = "DATABASE_URL"
              }
            }
          }
        }

        container {
          name  = "api"
          image = "${var.dockerhub_username}/tc5-athena:latest"

          port {
            container_port = 3000
          }

          env {
            name = "DATABASE_URL"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_env.metadata[0].name
                key  = "DATABASE_URL"
              }
            }
          }

          env {
            name = "JWT_SECRET"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_env.metadata[0].name
                key  = "JWT_SECRET"
              }
            }
          }

          env {
            name = "AWS_ACCESS_KEY_ID"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_env.metadata[0].name
                key  = "AWS_ACCESS_KEY_ID"
              }
            }
          }

          env {
            name = "AWS_SECRET_ACCESS_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_env.metadata[0].name
                key  = "AWS_SECRET_ACCESS_KEY"
              }
            }
          }

          env {
            name = "AWS_SESSION_TOKEN"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_env.metadata[0].name
                key  = "AWS_SESSION_TOKEN"
              }
            }
          }

          env {
            name  = "REDIS_HOST"
            value = var.redis_host
          }

          env {
            name  = "AWS_REGION"
            value = var.aws_region
          }

          env {
            name  = "CORS_ORIGINS"
            value = "*"
          }

          resources {
            requests = {
              cpu    = "250m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 3000
            }
            initial_delay_seconds = 30
            period_seconds        = 10
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 3000
            }
            initial_delay_seconds = 15
            period_seconds        = 5
            failure_threshold     = 3
          }
        }
      }
    }
  }

  depends_on = [kubernetes_namespace.athena, kubernetes_secret.api_env]
}

resource "kubernetes_service" "api" {
  metadata {
    name      = "api-service"
    namespace = kubernetes_namespace.athena.metadata[0].name
  }

  spec {
    selector = {
      app = "tc5-athena-api"
    }

    port {
      port        = 80
      target_port = 3000
    }

    type = "LoadBalancer"
  }

  depends_on = [kubernetes_deployment.api]
}
