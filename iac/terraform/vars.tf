variable "aws_region" {
  description = "The AWS region to deploy the resources"
  default     = "us-east-1"
}

variable "projectName" {
  description = "The name of the project"
  default     = "tc5-g192-athena-v1"
}

variable "db_service_name" {
  description = "Nome do service do banco de dados"
  type        = string
  default     = "postgres-db-service"
}

variable "db_namespace" {
  description = "Namespace do banco de dados"
  type        = string
  default     = "tc5-athena-db"
}

variable "db_user" {
  description = "O nome de usuário para o banco de dados RDS."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "A senha para o usuário do banco de dados RDS."
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "O nome do banco de dados inicial a ser criado na instância RDS."
  type        = string
}

variable "grafana_admin_user" {
  description = "Usuário admin do Grafana"
  type        = string
  default     = "admin"
}

variable "grafana_admin_password" {
  description = "Senha do admin do Grafana"
  type        = string
  sensitive   = true
}

variable "dockerhub_username" {
  description = "Usuário do Docker Hub para pull de imagens privadas"
  type        = string
  default     = "dianabianca"
}

variable "dockerhub_password" {
  description = "Senha ou token de acesso do Docker Hub"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Chave secreta para assinatura dos tokens JWT"
  type        = string
  sensitive   = true
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID para o Grafana acessar o CloudWatch"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key para o Grafana acessar o CloudWatch"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS Session Token para o Grafana acessar o CloudWatch (necessário no AWS Academy)"
  type        = string
  sensitive   = true
  default     = ""
}
