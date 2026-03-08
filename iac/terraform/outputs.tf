output "grafana_url" {
  description = "URL do Grafana"
  value       = "kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
}
