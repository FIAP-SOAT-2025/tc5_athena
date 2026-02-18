output "api_service_name" {
  description = "Api Service Athena"
  value       = "api-service"
}

output "api_namespace" {
  description = "Namespace Athena"
  value       = "tc5-athena"
}


output "Athena_api_listener_arn" {
  description = "The ARN of the NLB Listener for the Athena Video Processor API service."
  value       = data.aws_lb_listener.api_listener.arn
}

output "api_load_balancer_hostname" {
  description = "The public hostname of the API's Network Load Balancer."
  value       = kubernetes_service.api_service.status[0].load_balancer[0].ingress[0].hostname
}