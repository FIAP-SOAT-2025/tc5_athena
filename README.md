# Athena - API de Processamento de Vídeos

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

API RESTful para upload e processamento de vídeos, construída com NestJS, com suporte a filas assíncronas e infraestrutura escalável.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Executando a Aplicação](#-executando-a-aplicação)
- [API Endpoints](#-api-endpoints)
- [Testes](#-testes)
- [Monitoramento](#-monitoramento)
- [Infraestrutura](#-infraestrutura)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 Visão Geral

O **Athena** é uma API para processamento de vídeos que permite:

- 📹 Upload de vídeos para processamento
- ⚡ Processamento assíncrono com filas (BullMQ)
- 🔐 Autenticação JWT com refresh tokens
- 👥 Gestão de usuários (ADMIN/BASIC)
- ☁️ Armazenamento em S3
- 📊 Monitoramento com Prometheus e Grafana

---

## 🛠 Tecnologias

| Tecnologia | Descrição |
|------------|-----------|
| **NestJS** | Framework Node.js para APIs escaláveis |
| **TypeScript** | Tipagem estática |
| **Prisma** | ORM para PostgreSQL |
| **PostgreSQL** | Banco de dados relacional |
| **Redis** | Cache e filas com BullMQ |
| **FFmpeg** | Processamento de vídeos |
| **AWS S3** | Armazenamento de arquivos |
| **Docker** | Containerização |
| **Terraform** | Infraestrutura como código |
| **Kubernetes** | Orquestração de containers (EKS) |
| **Prometheus + Grafana** | Monitoramento e métricas |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         Cliente                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API NestJS (:3000)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│  │  Auth   │  │  Users  │  │  Video  │  │   Storage    │   │
│  └─────────┘  └─────────┘  └────┬────┘  └──────────────┘   │
└────────────────────────────────┬┼───────────────────────────┘
                                 ││
              ┌──────────────────┘│
              ▼                   ▼
┌─────────────────────┐   ┌─────────────────────┐
│   Redis (BullMQ)    │   │    PostgreSQL       │
│   Filas de Vídeo    │   │    (Prisma ORM)     │
└─────────────────────┘   └─────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│           Video Worker (FFmpeg Processing)                  │
│                         │                                   │
│                         ▼                                   │
│                    AWS S3 Storage                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Pré-requisitos

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** e **Docker Compose**
- **FFmpeg** (para processamento local)

---

## 🚀 Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd tc5-hack

# Instale as dependências
npm install

# Gere o cliente Prisma
npx prisma generate

# Execute as migrations
npx prisma migrate dev
```

---

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/athena?schema=public"
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=athena

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=athena-videos

# Application
OUTPUT_FILE_NAME=output.zip
```

---

## ▶️ Executando a Aplicação

### Com Docker Compose (Recomendado)

```bash
# Inicia todos os serviços (API, PostgreSQL, Redis, Prometheus, Grafana)
docker-compose up -d

# Visualizar logs
docker-compose logs -f api
```

### Desenvolvimento Local

```bash
# Modo desenvolvimento (watch)
npm run start:dev

# Modo debug
npm run start:debug

# Modo produção
npm run build
npm run start:prod
```

---

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/auth/signin` | Login com email/senha |
| `POST` | `/auth/refresh` | Renovar access token |

### Usuários

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/users` | Criar novo usuário | ❌ |
| `GET` | `/users/:identifier` | Buscar usuário por ID/email | ✅ |

### Vídeos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/video` | Upload de vídeo | ✅ |
| `GET` | `/video/status/:jobId` | Status do processamento | ✅ |
| `GET` | `/video/:userId/:videoId` | Download do vídeo processado | ✅ |

### Métricas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/metrics` | Métricas Prometheus |

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:cov

# Testes e2e
npm run test:e2e
```

## Cobertura de testes unitários

![Cobertura de testes](./docs/cobertura_test.png)

---

## 📊 Monitoramento

A aplicação inclui uma stack completa de monitoramento:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Prometheus** | http://localhost:9090 | Coleta de métricas |
| **Grafana** | http://localhost:3001 | Dashboards de visualização |
| **Postgres Exporter** | http://localhost:9187 | Métricas do PostgreSQL |

### Dashboards Disponíveis

- **Athena API — Métricas HTTP**: Requisições, latência, erros
- **Athena — Saúde do Sistema**: CPU, memória, status dos pods

Para mais detalhes, consulte a [documentação de monitoramento](docs/monitoring.md).

---

## 🏗 Infraestrutura

O projeto inclui configurações de infraestrutura como código:

```
iac/terraform/
├── provider.tf          # Configuração AWS/K8s
├── k8s-namespace.tf     # Namespace da aplicação
├── k8s-deployment.tf    # Deployment da API
├── k8s-service.tf       # Service LoadBalancer
├── k8s-ingress.tf       # Ingress Controller
├── k8s-secrets.tf       # Secrets (JWT, DB)
├── k8s-configmap.tf     # ConfigMaps
├── k8s-redis.tf         # Redis no cluster
├── k8s-db-migrate-job.tf # Job de migrations
├── monitoring-*.tf      # Stack de monitoramento
└── vars.tf              # Variáveis
```

### Deploy no Kubernetes

```bash
cd iac/terraform
terraform init
terraform plan
terraform apply
```

---

## 📁 Estrutura do Projeto

```
src/
├── main.ts                 # Bootstrap da aplicação
├── app.module.ts           # Módulo principal
├── auth/                   # Módulo de autenticação
│   ├── gateways/
│   │   ├── controller/     # Controllers
│   │   ├── security/       # Guards JWT
│   │   └── interfaces/
│   └── usecases/           # Casos de uso
├── users/                  # Módulo de usuários
│   ├── domain/             # Entidades
│   ├── gateways/
│   │   ├── controllers/
│   │   ├── repository/
│   │   └── database/
│   └── usecases/
├── video/                  # Módulo de vídeos
│   ├── domain/
│   ├── gateways/
│   │   ├── controllers/
│   │   └── consumers/      # Workers de fila
│   └── usecases/
├── storage/                # Módulo de storage (S3)
├── metrics/                # Middleware Prometheus
├── common/                 # Utilitários
└── database/               # Conexão Prisma
```

---

## 📄 Licença

Este projeto é privado e não possui licença pública.