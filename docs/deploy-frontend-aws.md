# Deploy do Frontend (Separado) na AWS

Guia para build e deploy **somente** da aplicação frontend (`frontend/`) no EKS.

## 1. Build local da imagem

```bash
cd frontend

docker build \
  --build-arg VITE_API_URL=https://<API_DOMAIN> \
  -t tc5-athena-frontend:latest \
  .
```

## 2. Teste local com Docker Compose (somente frontend)

```bash
cd frontend
docker compose up --build -d
```

A aplicação ficará disponível em: `http://localhost:8080`

## 3. Push para ECR

```bash
aws ecr get-login-password --region <REGION> \
  | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com

docker tag tc5-athena-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/tc5-athena-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/tc5-athena-frontend:latest
```

## 4. Deploy no Kubernetes (EKS)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tc5-athena-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tc5-athena-frontend
  template:
    metadata:
      labels:
        app: tc5-athena-frontend
    spec:
      containers:
        - name: frontend
          image: <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/tc5-athena-frontend:latest
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: tc5-athena-frontend
spec:
  type: LoadBalancer
  selector:
    app: tc5-athena-frontend
  ports:
    - port: 80
      targetPort: 80
```

Aplicar:

```bash
kubectl apply -f k8s/frontend.yaml
```

## Observações

- O frontend e backend ficam desacoplados em imagens e deploys diferentes.
- Defina `VITE_API_URL` apontando para a URL pública da API antes do build da imagem.
- Em produção, prefira `Ingress` + `AWS Load Balancer Controller`.
