# Video Processing App

Aplicação full-stack para processamento de vídeos com API NestJS e frontend React.

## Arquitetura

```
tc5-hack/
├── src/                 # Backend NestJS API
├── frontend/            # Frontend React
├── prisma/              # Database schema e migrations
├── iac/                 # Infrastructure as Code (Terraform)
└── monitoring/          # Prometheus & Grafana configs
```

## Requisitos

- Node.js 18+
- npm ou yarn
- Docker e Docker Compose (para banco de dados e serviços)
- PostgreSQL (ou usar via Docker)
- Redis (ou usar via Docker)

## Quick Start (Ambiente Completo)

### 1. Iniciar serviços com Docker

```bash
docker-compose up -d
```

Isso iniciará:
- PostgreSQL (porta 5432)
- Redis (porta 6379)

### 2. Configurar variáveis de ambiente

```bash
# Backend
cp .env.example .env
# Editar .env com suas configurações

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Instalar dependências

```bash
# Backend
npm install

# Frontend
cd frontend && npm install && cd ..
```

### 4. Rodar migrations do banco

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Executar os projetos

```bash
# Terminal 1 - Backend (porta 3000)
npm run start:dev

# Terminal 2 - Frontend (porta 5173)
cd frontend && npm run dev
```

---

## Backend (API NestJS)

### Configuração

Variáveis de ambiente necessárias no `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/videodb"
JWT_SECRET="your-jwt-secret"
REDIS_HOST="localhost"
REDIS_PORT="6379"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="your-bucket"
```

### Comandos

```bash
# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:e2e
npm run test:cov
```

### Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/signin` | Login | Não |
| POST | `/auth/refresh` | Refresh token | Não |
| POST | `/users` | Criar usuário | Não |
| GET | `/users/:identifier` | Buscar usuário | Sim |
| POST | `/video` | Upload de vídeo | Sim |
| GET | `/video/status/:jobId` | Status do processamento | Sim |
| GET | `/video/:userId/:videoId` | Download do resultado | Sim |

---

## Frontend (React + Vite)

### Configuração

Variáveis de ambiente no `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Comandos

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Páginas

| Rota | Descrição | Requer Login |
|------|-----------|--------------|
| `/login` | Tela de login | Não |
| `/register` | Cadastro de usuário | Não |
| `/` | Dashboard | Sim |
| `/upload` | Upload de vídeo | Sim |
| `/status` | Status do processamento | Sim |
| `/profile` | Perfil do usuário | Sim |

---

## Desenvolvimento

### Rodar ambos projetos simultaneamente

**Opção 1: Dois terminais**

```bash
# Terminal 1
npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

**Opção 2: Usando concurrently**

```bash
npm install -g concurrently
concurrently "npm run start:dev" "cd frontend && npm run dev"
```

### URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger (API docs)**: http://localhost:3000/api

---

## Testes

```bash
# Testes unitários do backend
npm run test

# Testes e2e do backend
npm run test:e2e

# Coverage
npm run test:cov
```

---

## Docker

### Build completo

```bash
docker-compose up --build
```

### Apenas serviços de infraestrutura

```bash
docker-compose up -d postgres redis
```

---

## Monitoring

A aplicação inclui configuração de Prometheus e Grafana para monitoramento.

Consulte [docs/monitoring.md](docs/monitoring.md) para mais detalhes.

---

## License

MIT
