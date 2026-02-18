variable "aws_region" {
  description = "The AWS region to deploy the resources"
  default     = "us-east-1"
}

variable "projectName" {
  description = "The name of the project"
  default     = "tc5-athena-v1"
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

