
resource "time_sleep" "wait_for_lb" {
  create_duration = "60s"
  depends_on      = [kubernetes_service.api_service]
}


data "aws_lb" "api_lb" {
  tags = {
    "kubernetes.io/service-name" = "tc5-athena/api-service"
  }
  depends_on = [time_sleep.wait_for_lb]
}


data "aws_lb_listener" "api_listener" {
  load_balancer_arn = data.aws_lb.api_lb.arn
  port              = 80
}

data "terraform_remote_state" "db" {
  backend = "s3"
  config = {
    bucket = "terraform-state-tc5-g192-athena-v1"
    key    = "db/terraform.tfstate"
    region = "us-east-1"
  }
}