# Kong API Gateway - EV Rental Microservices

Hệ thống microservices sử dụng Kong API Gateway để quản lý và load balance các services.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Kong Gateway  │    │   Auth Service  │
│   (React)       │◄──►│   (Port 8000)  │◄──►│   (Port 8003)   │
│   (HTTPS:443)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Station Service │
                       │ (Remote, 3 Ports)│
                       │ 3001, 3002, 3003│
                       └─────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for development)
- OpenSSL (for SSL certificates)

### 2. Setup

```bash
# Clone repository
git clone <your-repo>
cd EV-Station-based-Rental-System

# Copy environment variables
cp env.example .env
# Edit .env with your production values

# Generate SSL certificates
chmod +x nginx/ssl/generate-ssl.sh
./nginx/ssl/generate-ssl.sh

# Deploy system
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3. Access Services

- **Frontend**: https://localhost
- **Kong Manager**: http://localhost:8002
- **Kong Admin API**: http://localhost:8001
- **Auth Service**: http://localhost:8003

## 🔧 Configuration

### Environment Variables

```bash
# Database
MYSQL_ROOT_PASSWORD=your_secure_mysql_password
KONG_DB_PASSWORD=your_secure_kong_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key

# Station Service Hosts
STATION_HOST_1=192.168.1.100
STATION_HOST_2=192.168.1.100
STATION_HOST_3=192.168.1.100

# Client URLs
CLIENT_URL=http://localhost:3000,http://localhost:5173,https://localhost
```

### Kong Services

| Service | URL | Description |
|---------|-----|-------------|
| auth-service | http://auth-backend:8000 | Authentication service |
| station-service-3001 | http://192.168.1.100:3001 | Station service port 1 |
| station-service-3002 | http://192.168.1.100:3002 | Station service port 2 |
| station-service-3003 | http://192.168.1.100:3003 | Station service port 3 |

### Kong Routes

| Route | Service | Description |
|-------|---------|-------------|
| `/api/v1/auth/*` | auth-service | Authentication endpoints |
| `/api/v1/stations` | station-service-* | Load balanced station API |
| `/api/v1/stations/port1/*` | station-service-3001 | Direct port 1 access |
| `/api/v1/stations/port2/*` | station-service-3002 | Direct port 2 access |
| `/api/v1/stations/port3/*` | station-service-3003 | Direct port 3 access |

## 🔐 Security Features

### JWT Authentication
- All API endpoints require JWT token
- Token validation via Kong JWT plugin
- Automatic token refresh handling

### Rate Limiting
- API rate limiting: 1000 requests/minute
- Login rate limiting: 5 requests/minute
- Per-IP rate limiting

### SSL/TLS
- HTTPS encryption for all traffic
- Self-signed certificates for development
- Production-ready SSL configuration

### CORS
- Cross-origin resource sharing enabled
- Configurable allowed origins
- Preflight request handling

## 📊 Monitoring

### Health Checks

```bash
# Check all services
./scripts/monitoring.sh

# Check Kong status
curl http://localhost:8001/status

# Check Kong health
curl http://localhost:8001/health
```

### Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f kong
docker compose logs -f nginx
docker compose logs -f auth-backend
```

### Metrics

- Kong Manager: http://localhost:8002
- Kong Admin API: http://localhost:8001
- Service health endpoints
- Load balancing statistics

## 🛠️ Management

### Kong Manager
- Web UI: http://localhost:8002
- Manage services, routes, plugins
- Monitor performance and health
- Configure authentication

### Kong Admin API
- REST API: http://localhost:8001
- Programmatic configuration
- Service management
- Plugin configuration

### Scripts

```bash
# Deploy system
./scripts/deploy.sh

# Monitor services
./scripts/monitoring.sh

# Backup configuration
./scripts/backup.sh

# Setup Kong services
./scripts/kong-production-setup.sh

# Setup JWT authentication
./scripts/kong-jwt-setup.sh
```

## 🔄 Load Balancing

### Round Robin
- Default load balancing algorithm
- Distributes requests across all healthy services
- Automatic failover to healthy services

### Health Checks
- Active health checks every 30 seconds
- Automatic service discovery
- Unhealthy service removal

### Service Discovery
- Automatic service registration
- Dynamic service updates
- Health-based routing

## 🚨 Troubleshooting

### Common Issues

#### Kong Gateway Not Starting
```bash
# Check Kong logs
docker compose logs kong

# Check Kong database
docker compose logs kong-db

# Restart Kong
docker compose restart kong
```

#### SSL Certificate Issues
```bash
# Regenerate certificates
./nginx/ssl/generate-ssl.sh

# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout
```

#### Service Connection Issues
```bash
# Check service health
curl http://localhost:8001/health

# Check service configuration
curl http://localhost:8001/services

# Check routes
curl http://localhost:8001/routes
```

#### Authentication Issues
```bash
# Check JWT plugin
curl http://localhost:8001/plugins

# Check consumers
curl http://localhost:8001/consumers

# Test authentication
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/stations/
```

### Performance Issues

#### High Memory Usage
```bash
# Check container resources
docker stats

# Restart services
docker compose restart
```

#### Slow Response Times
```bash
# Check Kong metrics
curl http://localhost:8001/status

# Check service health
curl http://localhost:8001/health
```

## 📈 Scaling

### Horizontal Scaling
- Add more Station Service instances
- Configure additional Kong services
- Update load balancing configuration

### Vertical Scaling
- Increase container resources
- Optimize Kong configuration
- Tune database settings

## 🔒 Security Best Practices

### Production Deployment
1. Use strong passwords for all services
2. Generate proper SSL certificates from CA
3. Configure firewall rules
4. Enable audit logging
5. Regular security updates

### JWT Security
1. Use strong JWT secrets
2. Implement token expiration
3. Use HTTPS for all communications
4. Regular token rotation

### Network Security
1. Use private networks for internal communication
2. Implement proper firewall rules
3. Monitor network traffic
4. Use VPN for remote access

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile

### Station Endpoints
- `GET /api/v1/stations/` - Get all stations (load balanced)
- `GET /api/v1/stations/{id}` - Get station by ID
- `GET /api/v1/stations/port1/` - Get stations from port 1
- `GET /api/v1/stations/port2/` - Get stations from port 2
- `GET /api/v1/stations/port3/` - Get stations from port 3

### Health Endpoints
- `GET /healthz` - Nginx health check
- `GET /kong-health` - Kong health check
- `GET /api/v1/health` - Auth service health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review Kong documentation
- Check service logs
- Contact the development team
