variable "aws_region" {
  description = "The AWS region to deploy the resources"
  default     = "us-east-1"
}

variable "projectName" {
  description = "The name of the project"
  default     = "tc5-g192-athena"
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

variable "db_user" {
  description = "Usuário do banco de dados"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Senha do banco de dados"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Nome do banco de dados"
  type        = string
}

variable "db_host" {
  description = "Host do banco de dados (RDS endpoint)"
  type        = string
  default     = ""
}

variable "dockerhub_username" {
  description = "Usuário do DockerHub"
  type        = string
}

variable "dockerhub_password" {
  description = "Token/senha do DockerHub"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret para geração de JWT"
  type        = string
  sensitive   = true
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS Session Token"
  type        = string
  sensitive   = true
  default     = ""
}
