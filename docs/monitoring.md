# Monitoramento — Prometheus e Grafana

A stack de monitoramneto do Athena é composta por Prometheus (coleta de métricas) e Grafana (visualização). Ambos são implantados no cluster EKS via Helm, gerenciados pelo Terraform, no namespace `monitoring`.

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Prometheus](#2-prometheus)
   - [O que é](#21-o-que-é)
   - [Como está implantado](#22-como-está-implantado)
   - [Como o scraping funciona](#23-como-o-scraping-funciona)
   - [Métricas coletadas](#24-métricas-coletadas)
   - [Como acessar](#25-como-acessar)
3. [Grafana](#3-grafana)
   - [O que é](#31-o-que-é)
   - [Como está implantado](#32-como-está-implantado)
   - [Datasource configurado](#33-datasource-configurado)
   - [Como os dashboards são carregados](#34-como-os-dashboards-são-carregados)
   - [Como acessar](#35-como-acessar)
4. [Dashboards](#4-dashboards)
   - [Athena API — Métricas HTTP](#41-athena-api--métricas-http)
   - [Athena — Saúde do Sistema](#42-athena--saúde-do-sistema)
5. [Instrumentação da API](#5-instrumentação-da-api)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Namespace: tc5-athena                     │
│                                                             │
│   ┌──────────────────────────────────────────────────┐     │
│   │  Pod: tc5-athena-api (porta 3000)                │     │
│   │  - Expõe métricas em GET /metrics                │     │
│   │  - Annotations: prometheus.io/scrape: "true"     │     │
│   └──────────────────────────────────────────────────┘     │
└────────────────────────────┬────────────────────────────────┘
                             │ scraping (pull)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Namespace: monitoring                     │
│                                                             │
│   ┌──────────────────┐         ┌──────────────────────┐    │
│   │    Prometheus    │ ──────► │       Grafana        │    │
│   │  (porta 9090)    │  query  │     (porta 3000)     │    │
│   └──────────────────┘         └──────────────────────┘    │
│                                         ▲                   │
│                         ┌───────────────┘                   │
│              ┌──────────┴──────────┐                        │
│              │  ConfigMap          │                        │
│              │  grafana-dashboards │                        │
│              │  (sidecar watcher)  │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Fluxo de dados:**
1. A API NestJS expõe métricas no endpoint `/metrics`
2. Prometheus faz scraping do endpoint a cada 30s (via kubernetes-pods job)
3. Grafana consulta o Prometheus via PromQL para renderizar os dashboards
4. Os dashboards são carregados automaticamente via ConfigMap + sidecar do Grafana

---

## 2. Prometheus

### 2.1 O que é

Prometheus é um sistema open-source de monitoramento e alerta, desenvolvido pela CNCF. Ele coleta métricas via modelo **pull** (scraping HTTP), armazena em banco de dados de séries temporais e permite consultas via linguagem **PromQL**.

**Características:**
- Coleta métricas em formato texto simples (exposition format)
- Armazena séries temporais com labels (chave=valor)
- Suporta alertas via AlertManager
- Integra nativamente com Kubernetes via service discovery

### 2.2 Como está implantado

Prometheus é instalado via **Helm chart oficial** (`prometheus-community/prometheus`), gerenciado pelo Terraform no arquivo `iac/terraform/monitoring-prometheus.tf`.

```
Namespace:  monitoring
Chart:      prometheus-community/prometheus v25.11.0
Service:    prometheus-server (ClusterIP, porta 80 → 9090)
```

**Configurações de deploy:**
```hcl
# Persistência desabilitada (dados não sobrevivem a restarts)
server.persistentVolume.enabled = false

# Componentes desabilitados
alertmanager.enabled        = false
prometheus-pushgateway.enabled = false
```

O Helm chart inclui automaticamente:
- `prometheus-server` — servidor principal
- `prometheus-kube-state-metrics` — exporta métricas do estado dos objetos Kubernetes (Deployments, Pods, etc.)
- `prometheus-node-exporter` — exporta métricas de hardware dos nodes (CPU, memória, disco)
- `prometheus-alertmanager` — desabilitado no projeto (`alertmanager.enabled = false`)
- `prometheus-pushgateway` — desabilitado no projeto (`prometheus-pushgateway.enabled = false`)

### 2.3 Como o scraping funciona

O Prometheus usa **Kubernetes Service Discovery** para encontrar automaticamente os pods que devem ser monitorados. Um pod é incluído no scraping quando possui as seguintes annotations:

```yaml
# Annotations no pod da API (k8s-deployment.tf)
annotations:
  prometheus.io/scrape: "true"     # habilita o scraping
  prometheus.io/path: "/metrics"   # caminho do endpoint de métricas
  prometheus.io/port: "3000"       # porta onde as métricas são expostas
```

O job `kubernetes-pods` do Prometheus descobre todos os pods com `prometheus.io/scrape: "true"` no cluster e adiciona automaticamente as seguintes labels às métricas coletadas:

| Label | Valor exemplo | Origem |
|-------|--------------|--------|
| `namespace` | `tc5-athena` | Namespace do pod |
| `pod` | `tc5-athena-api-xxx` | Nome do pod |
| `instance` | `10.0.1.5:3000` | IP:porta do pod |
| `app` | `tc5-athena-api` | Label `app` do pod |
| `job` | `kubernetes-pods` | Nome do job de scraping |


### 2.4 Métricas coletadas

#### Métricas HTTP customizadas (definidas na API)

Implementadas via `MetricsMiddleware` (`src/metrics/prometheus.middleware.ts`) usando `res.on('finish')`, capturando exclusivamente as rotas dos controllers da API (`/auth`, `/users`, `/video`, `/health`), incluindo erros de guards (401, 403) e validações (400).

| Métrica | Tipo | Labels | Descrição |
|---------|------|--------|-----------|
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Total de requisições HTTP recebidas |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Duração das requisições em segundos |

**Exemplo de dados no endpoint `/metrics`:**
```
http_requests_total{method="POST",route="/auth/signin",status_code="200"} 42
http_requests_total{method="GET",route="/video/status/:jobId",status_code="401"} 7
http_request_duration_seconds_bucket{method="POST",route="/video",le="0.5"} 38
http_request_duration_seconds_sum{method="POST",route="/video"} 12.45
http_request_duration_seconds_count{method="POST",route="/video"} 28
```

#### Métricas padrão do Node.js (coletadas automaticamente pelo prom-client)

O `@willsoto/nestjs-prometheus` chama `collectDefaultMetrics()` automaticamente ao inicializar.

**Processo:**

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `process_cpu_seconds_total` | Counter | Tempo total de CPU (user + system) em segundos |
| `process_cpu_user_seconds_total` | Counter | Tempo de CPU em modo usuário |
| `process_cpu_system_seconds_total` | Counter | Tempo de CPU em modo sistema |
| `process_resident_memory_bytes` | Gauge | Memória residente (RSS) em bytes |
| `process_heap_bytes` | Gauge | Tamanho do heap em bytes |
| `process_open_fds` | Gauge | Número de file descriptors abertos |
| `process_start_time_seconds` | Gauge | Timestamp de início do processo |

**Node.js:**

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `nodejs_heap_size_total_bytes` | Gauge | Tamanho total do heap V8 |
| `nodejs_heap_size_used_bytes` | Gauge | Tamanho do heap V8 em uso |
| `nodejs_external_memory_bytes` | Gauge | Memória externa ao heap (Buffer, etc.) |
| `nodejs_active_handles_total` | Gauge | Total de handles libuv ativos |
| `nodejs_active_handles` | Gauge | Handles ativos por tipo (TCP, Timer, etc.) |
| `nodejs_active_requests_total` | Gauge | Total de requests libuv ativos |
| `nodejs_eventloop_lag_seconds` | Gauge | Lag atual do event loop |
| `nodejs_eventloop_lag_p50_seconds` | Gauge | Percentil 50 do lag do event loop |
| `nodejs_eventloop_lag_p90_seconds` | Gauge | Percentil 90 do lag do event loop |
| `nodejs_eventloop_lag_p99_seconds` | Gauge | Percentil 99 do lag do event loop |
| `nodejs_gc_duration_seconds` | Histogram | Duração das coletas de garbage collection |
| `nodejs_version_info` | Gauge | Informações da versão do Node.js |

#### Métricas do Kubernetes (via kube-state-metrics)

| Métrica | Descrição |
|---------|-----------|
| `kube_deployment_status_replicas_ready` | Pods prontos no Deployment |
| `kube_pod_container_status_restarts_total` | Número de restarts de containers |
| `kube_pod_status_phase` | Fase dos pods (Running, Pending, etc.) |
| `container_cpu_usage_seconds_total` | Uso de CPU dos containers (cAdvisor) |
| `container_memory_working_set_bytes` | Memória em uso pelos containers (cAdvisor) |

### 2.5 Como acessar

O Prometheus não tem LoadBalancer exposto. Para acessar localmente:

```bash
# Configure o kubectl com as credenciais AWS
aws eks update-kubeconfig --name eks-tc5-g192-athena-v1-v1 --region us-east-1

# Port-forward para acessar o Prometheus
kubectl port-forward svc/prometheus-server -n monitoring 9091:80

# Acesse em: http://localhost:9091
```

---

## 3. Grafana

### 3.1 O que é

Grafana é uma plataforma open-source de observabilidade e visualização de dados. Permite criar dashboards interativos a partir de múltiplas fontes de dados (Prometheus, CloudWatch, Loki, etc.) usando uma interface web.

**Características:**
- Suporta múltiplos datasources simultaneamente
- Alertas integrados
- Dashboards como código (JSON exportável/importável)
- Provisionamento automático via ConfigMaps no Kubernetes

### 3.2 Como está implantado

Grafana é instalado via **Helm chart oficial** (`grafana/grafana`), gerenciado pelo Terraform no arquivo `iac/terraform/monitoring-grafana.tf`.

```
Namespace:  monitoring
Service:    grafana (LoadBalancer — IP externo da AWS)
Chart:      grafana/grafana v7.3.7
```

**Configurações de deploy:**
```hcl
# Persistência desabilitada (dados não sobrevivem a restarts)
persistence.enabled = false

# Sidecar para auto-carregamento de dashboards
sidecar.dashboards.enabled = true
sidecar.dashboards.label   = "grafana_dashboard"

# Tipo de serviço com IP externo
service.type = LoadBalancer
```

### 3.3 Datasource configurado

O datasource é configurado automaticamente via Helm values no Terraform:

```yaml
name:      Prometheus
type:      prometheus
url:       http://prometheus-server.monitoring.svc.cluster.local
isDefault: true
```

### 3.4 Como os dashboards são carregados

O Grafana usa um **sidecar container** (`grafana-sc-dashboard`) que observa ConfigMaps no cluster com a label `grafana_dashboard: "1"` e os carrega automaticamente no Grafana, sem necessidade de reiniciar o pod.

**Fluxo de carregamento:**

```
Terraform apply
      │
      ▼
kubernetes_config_map "grafana_dashboards"
  (label: grafana_dashboard=1)
  data:
    api-dashboard.json   = <conteúdo do arquivo JSON>
    system-overview.json = <conteúdo do arquivo JSON>
      │
      ▼
Grafana sidecar detecta o ConfigMap
      │
      ▼
Dashboards carregados automaticamente no Grafana
```

**Arquivo Terraform que gerencia os dashboards:**
```
iac/terraform/monitoring-grafana.tf → resource "kubernetes_config_map" "grafana_dashboards"
```

**Arquivos JSON dos dashboards:**
```
monitoring/grafana/dashboards/
├── api-dashboard.json      # Dashboard: Athena API — Métricas HTTP
└── system-overview.json    # Dashboard: Athena — Saúde do Sistema
```

### 3.5 Como acessar

O Grafana tem um LoadBalancer com IP externo da AWS.

```bash
# Obter o hostname do LoadBalancer
kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Port-forward alternativo (se o LB não estiver disponível)
kubectl port-forward svc/grafana -n monitoring 3000:80

# Acesse em: http://<hostname-do-lb>  ou  http://localhost:3000
```

**Credenciais:**
- Usuário: configurado via `var.grafana_admin_user` (secret no GitHub Actions)
- Senha: configurada via `var.grafana_admin_password` (secret no GitHub Actions), aplicada pelo Terraform no Helm release

---

## 4. Dashboards

### 4.1 Athena API — Métricas HTTP

**Arquivo:** `monitoring/grafana/dashboards/api-dashboard.json`
**UID:** `athena-api`
**Janela de tempo padrão:** Última 1 hora (`now-1h`)
**Auto-refresh:** 30 segundos
**Datasource:** Prometheus

Este dashboard foca nas métricas HTTP da API, permitindo monitorar saúde, performance e erros em tempo real.

---

#### Seção 1: KPIs — Indicadores Principais (linha do topo)

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Total Requisições (1h)** | Stat | `sum(increase(http_requests_total{namespace="tc5-athena"}[1h]))` | Número total de requisições na última hora |
| **Requisições / seg** | Stat | `sum(rate(http_requests_total{namespace="tc5-athena"}[5m]))` | Taxa atual de requisições por segundo |
| **Taxa de Erros 5xx** | Stat | `sum(rate(...status_code=~"5.."}[5m])) / sum(rate(...[5m])) * 100` | Percentual de erros de servidor. Verde < 1%, Amarelo < 5%, Vermelho ≥ 5% |
| **Latência P95** | Stat | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))` | 95% das requisições respondem abaixo desse valor. Verde < 500ms, Amarelo < 1s, Vermelho ≥ 1s |

---

#### Seção 2: Tráfego de Requisições HTTP

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Taxa de Requisições por Endpoint** | Timeseries | `sum by (route, method) (rate(http_requests_total[5m]))` | Volume de requisições ao longo do tempo, separado por rota e método HTTP |
| **Requisições por Status HTTP** | Timeseries | `sum by (status_code) (rate(http_requests_total[5m]))` | Distribuição de status codes (2xx verde, 4xx amarelo, 5xx vermelho) |

---

#### Seção 3: Tempos de Resposta

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Percentis de Latência (P50/P95/P99)** | Timeseries | `histogram_quantile(0.50/0.95/0.99, ...)` | Latência em percentis: P50 = mediana, P95 = usuário típico lento, P99 = pior caso |
| **Tempo Médio de Resposta por Endpoint** | Timeseries | `rate(duration_sum[5m]) / rate(duration_count[5m])` | Média de latência separada por rota e método |

---

#### Seção 4: Rastreamento de Erros

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Erros HTTP (4xx e 5xx) por Endpoint** | Timeseries | `sum by (route, method, status_code) (rate(...status_code=~"[45].."}[5m]))` | Quais endpoints estão gerando erros e com qual status code |
| **Taxa de Erros ao Longo do Tempo (%)** | Timeseries | `sum(rate(...5xx[5m])) / sum(rate(...[5m])) * 100` | Evolução da taxa de erros 5xx (vermelho) e 4xx (amarelo) |

---

#### Seção 5: Métricas de Processo Node.js

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Uso de CPU (%)** | Timeseries | `rate(process_cpu_seconds_total[5m]) * 100` | Percentual de CPU consumido pelo processo Node.js |
| **Memória Heap Node.js** | Timeseries | `nodejs_heap_size_used_bytes` / `nodejs_heap_size_total_bytes` | Uso de memória heap V8 e memória externa |
| **Lag do Event Loop** | Timeseries | `nodejs_eventloop_lag_p50/p90/p99_seconds` | Latência do event loop nos percentis 50, 90 e 99. Valores altos indicam blocking I/O |
| **Handles e Requests Ativos** | Timeseries | `nodejs_active_handles_total` / `nodejs_active_requests_total` | Número de conexões e operações assíncronas abertas no libuv |

---

### 4.2 Athena — Saúde do Sistema

**Arquivo:** `monitoring/grafana/dashboards/system-overview.json`
**UID:** `athena-system`
**Janela de tempo padrão:** Últimas 24 horas (`now-24h`)
**Auto-refresh:** 30 segundos
**Datasource:** Prometheus

Este dashboard oferece uma visão de alto nível da saúde do sistema ao longo do tempo. Ideal para análise de tendências e identificação de padrões de uso.

---

#### Seção 1: Status Geral (linha do topo)

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **API Status** | Stat | `up{job="kubernetes-pods", app="tc5-athena-api"}` | Status da API: **UP** (verde) ou **DOWN** (vermelho) |
| **Pods Prontos** | Stat | `kube_deployment_status_replicas_ready{namespace="tc5-athena", deployment="tc5-athena-api"}` | Número de réplicas da API em estado Ready |
| **Total Requisições (1h)** | Stat | `sum(increase(http_requests_total{namespace="tc5-athena"}[1h]))` | Total de requisições na última hora |
| **Restarts de Pods** | Stat | `sum(kube_pod_container_status_restarts_total{namespace="tc5-athena"})` | Total de restarts de containers. Verde = 0, Amarelo ≥ 1, Vermelho ≥ 5 |

---

#### Seção 2: Endpoints Mais Utilizados (24h)

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Top Endpoints por Volume** | Bar gauge | `topk(7, sum by (route, method) (increase(...[24h])))` | Os 7 endpoints com maior volume de requisições nas últimas 24h |
| **Top Endpoints com Mais Erros** | Bar gauge | `topk(7, sum by (route, method) (increase(...4xx/5xx...[24h])))` | Os 7 endpoints com mais erros 4xx e 5xx nas últimas 24h |

---

#### Seção 3: Atividade da API nas Últimas 24h

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **Volume de Requisições por Endpoint** | Timeseries | `sum by (route, method) (rate(http_requests_total[10m]))` | Evolução do tráfego por endpoint nas últimas 24h (janela de 10 minutos) |

---

#### Seção 4: Recursos do Container (Kubernetes)

| Painel | Tipo | Query PromQL | Descrição |
|--------|------|-------------|-----------|
| **CPU do Container (%)** | Timeseries | `sum(rate(container_cpu_usage_seconds_total{container="tc5-athena-api"}[5m])) * 100` | Uso de CPU do container conforme visto pelo Kubernetes (cAdvisor) |
| **Memória do Container** | Timeseries | `sum(container_memory_working_set_bytes{container="tc5-athena-api"})` | Working set de memória do container em bytes |

---

## 5. Instrumentação da API

A coleta de métricas HTTP na API NestJS é feita via **Middleware** (`src/metrics/prometheus.middleware.ts`).

### Registro no AppModule

```typescript
// src/app.module.ts
@Module({
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    }),
    MetricsMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .forRoutes(AuthController, UserController, VideoController, HealthController);
  }
}
```

> O middleware é aplicado apenas nos controllers da API (`/auth`, `/users`, `/video`, `/health`).

### Endpoint de métricas

O `PrometheusModule.register()` expõe automaticamente as métricas em:

```
GET /metrics
Content-Type: text/plain; version=0.0.4
```

Este endpoint é acessado pelo Prometheus a cada scrape e não deve ser exposto publicamente.

---
