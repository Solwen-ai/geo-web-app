# Docker Deployment Guide

This guide explains how to deploy the Geo Web App using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- API Keys for OpenAI and SerpAPI

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd geo-web-app
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your API keys
nano .env
```

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SERPAPI_KEY`: Your SerpAPI key
- `VITE_API_URL`: Frontend API URL (default: `/api`)

### 3. Build and Start Services
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Frontend API URL | `/api` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes |
| `SERPAPI_KEY` | SerpAPI key | - | Yes |
| `NODE_ENV` | Node.js environment | `production` | No |
| `PORT` | Backend port | `3001` | No |

### Custom API URL
If you need to use a different API URL (e.g., external API):

```bash
VITE_API_URL=https://api.myapp.com docker-compose up -d
```

### Development Setup
For development with hot reloading:

```bash
VITE_API_URL=http://localhost:3001 docker-compose up -d
```

## Service Architecture

```
Internet → Nginx (Port 80) → Frontend (Port 3000) → React Application
                    ↓
                Backend (Port 3001) → API Endpoints
```

### Services

1. **Nginx** (Port 80)
   - Reverse proxy and load balancer
   - Serves frontend and proxies API requests
   - Handles SSL termination and security headers

2. **Frontend** (Port 3000, internal)
   - React application served by Node.js serve
   - Handles static file serving
   - Only accessible through Nginx

3. **Backend** (Port 3001, internal)
   - Node.js/Express API server
   - Handles question generation and scraping
   - Only accessible through Nginx

## File Persistence

The following files are persisted via Docker volumes:
- `./backend/geo.csv`: Generated CSV data
- `./backend/questions.txt`: Generated questions
- `./backend/playwright/params.ts`: Playwright parameters

## Health Checks

All services include health checks:
- **Nginx**: Checks Nginx health endpoint
- **Frontend**: Checks frontend service availability
- **Backend**: Checks Express health endpoint

## Troubleshooting

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nginx
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Check Service Status
```bash
docker-compose ps
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build nginx
docker-compose up -d --build frontend
```

### Access Container Shell
```bash
# Nginx container
docker-compose exec nginx sh

# Frontend container
docker-compose exec frontend sh

# Backend container
docker-compose exec backend sh
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes persisted data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Production Considerations

1. **SSL/TLS**: Add SSL certificate for HTTPS
2. **Domain**: Configure custom domain in Nginx
3. **Monitoring**: Add monitoring and logging
4. **Backup**: Set up backup for persisted files
5. **Scaling**: Consider load balancing for high traffic

## Security Notes

- Backend and frontend are not exposed to the internet
- All communication goes through Nginx proxy
- Non-root users run all services
- Security headers are configured in Nginx
