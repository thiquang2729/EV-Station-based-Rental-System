# Kong API Gateway - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Kong Gateway Issues

#### Kong Not Starting
**Symptoms:**
- Kong container fails to start
- Error: "Kong failed to start"

**Solutions:**
```bash
# Check Kong logs
docker compose logs kong

# Check Kong database connection
docker compose logs kong-db

# Restart Kong with fresh database
docker compose down
docker compose up -d kong-db
sleep 10
docker compose up -d kong

# Check Kong configuration
docker compose exec kong kong config
```

#### Kong Database Connection Issues
**Symptoms:**
- Kong cannot connect to PostgreSQL
- Error: "database connection failed"

**Solutions:**
```bash
# Check PostgreSQL status
docker compose ps kong-db

# Check database connectivity
docker compose exec kong-db pg_isready -U kong

# Restart database
docker compose restart kong-db

# Check environment variables
docker compose exec kong env | grep KONG
```

#### Kong Services Not Registered
**Symptoms:**
- Services not appearing in Kong Manager
- Routes returning 404 errors

**Solutions:**
```bash
# Re-run Kong setup
./scripts/kong-production-setup.sh

# Check services manually
curl http://localhost:8001/services

# Check routes
curl http://localhost:8001/routes

# Restart Kong
docker compose restart kong
```

### 2. SSL/TLS Issues

#### SSL Certificate Problems
**Symptoms:**
- Browser shows SSL errors
- HTTPS not working
- Certificate validation failed

**Solutions:**
```bash
# Regenerate SSL certificates
./nginx/ssl/generate-ssl.sh

# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check certificate dates
openssl x509 -in nginx/ssl/cert.pem -dates -noout

# Restart Nginx
docker compose restart nginx
```

#### Mixed Content Issues
**Symptoms:**
- HTTP resources on HTTPS page
- Mixed content warnings

**Solutions:**
```bash
# Check Nginx configuration
docker compose exec nginx nginx -t

# Update frontend to use HTTPS
# Set REACT_APP_API_URL=https://localhost

# Check CORS configuration
curl -H "Origin: https://localhost" -v http://localhost:8000/api/v1/stations/
```

### 3. Authentication Issues

#### JWT Token Problems
**Symptoms:**
- 401 Unauthorized errors
- Token validation failed
- Authentication not working

**Solutions:**
```bash
# Check JWT plugin configuration
curl http://localhost:8001/plugins | jq '.[] | select(.name=="jwt")'

# Check consumers
curl http://localhost:8001/consumers

# Test JWT token
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/stations/

# Re-run JWT setup
./scripts/kong-jwt-setup.sh
```

#### CORS Issues
**Symptoms:**
- CORS errors in browser
- Preflight requests failing
- Cross-origin requests blocked

**Solutions:**
```bash
# Check CORS plugin
curl http://localhost:8001/plugins | jq '.[] | select(.name=="cors")'

# Test CORS headers
curl -H "Origin: https://localhost" -v http://localhost:8000/api/v1/stations/

# Update CORS configuration
curl -X POST http://localhost:8001/plugins \
  --data "name=cors" \
  --data "config.origins=*" \
  --data "config.methods=GET,POST,PUT,DELETE,OPTIONS"
```

### 4. Service Connection Issues

#### Station Service Not Reachable
**Symptoms:**
- Station API returning errors
- Connection timeout
- Service unavailable

**Solutions:**
```bash
# Check Station Service IPs in .env
cat .env | grep STATION_HOST

# Test direct connection
curl http://192.168.1.100:3001/health

# Check Kong service configuration
curl http://localhost:8001/services | jq '.[] | select(.name | contains("station"))'

# Update Station Service URLs
curl -X PATCH http://localhost:8001/services/station-service-3001 \
  --data "url=http://192.168.1.100:3001"
```

#### Auth Service Issues
**Symptoms:**
- Auth endpoints not working
- Login/logout failures
- User management issues

**Solutions:**
```bash
# Check Auth Service health
curl http://localhost:8003/api/v1/health

# Check Auth Service logs
docker compose logs auth-backend

# Test Auth Service directly
curl http://localhost:8003/api/v1/auth/health

# Restart Auth Service
docker compose restart auth-backend
```

### 5. Load Balancing Issues

#### Load Balancing Not Working
**Symptoms:**
- Requests not distributed
- Always hitting same service
- Load balancing errors

**Solutions:**
```bash
# Check service health
curl http://localhost:8001/health

# Test load balancing
for i in {1..10}; do
  curl http://localhost:8000/api/v1/stations/ | jq '.server'
done

# Check service configuration
curl http://localhost:8001/services | jq '.[] | select(.name | contains("station"))'

# Restart Kong services
docker compose restart kong
```

#### Health Check Failures
**Symptoms:**
- Services marked as unhealthy
- Health check timeouts
- Service discovery issues

**Solutions:**
```bash
# Check health check configuration
curl http://localhost:8001/health

# Test individual services
curl http://192.168.1.100:3001/health
curl http://192.168.1.100:3002/health
curl http://192.168.1.100:3003/health

# Update health check settings
curl -X POST http://localhost:8001/plugins \
  --data "name=healthcheck" \
  --data "config.active.healthy.interval=30"
```

### 6. Performance Issues

#### High Memory Usage
**Symptoms:**
- Containers using too much memory
- System running slow
- Out of memory errors

**Solutions:**
```bash
# Check container resources
docker stats

# Check Kong memory usage
docker compose exec kong kong config

# Restart services
docker compose restart

# Check for memory leaks
docker compose logs kong | grep -i memory
```

#### Slow Response Times
**Symptoms:**
- API responses slow
- Timeout errors
- Poor performance

**Solutions:**
```bash
# Check Kong metrics
curl http://localhost:8001/status

# Check service response times
time curl http://localhost:8000/api/v1/stations/

# Check database performance
docker compose exec mysql mysql -u root -proot -e "SHOW PROCESSLIST;"

# Optimize Kong configuration
curl -X PATCH http://localhost:8001/services/auth-service \
  --data "connect_timeout=30000" \
  --data "read_timeout=30000" \
  --data "write_timeout=30000"
```

### 7. Database Issues

#### MySQL Connection Problems
**Symptoms:**
- Auth Service cannot connect to MySQL
- Database connection errors
- MySQL container not starting

**Solutions:**
```bash
# Check MySQL status
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Test MySQL connection
docker compose exec mysql mysql -u root -proot -e "SELECT 1;"

# Restart MySQL
docker compose restart mysql

# Check MySQL configuration
docker compose exec mysql mysql -u root -proot -e "SHOW VARIABLES;"
```

#### Kong Database Issues
**Symptoms:**
- Kong cannot connect to PostgreSQL
- Database migration failures
- Kong configuration not persisting

**Solutions:**
```bash
# Check Kong database
docker compose ps kong-db

# Check PostgreSQL logs
docker compose logs kong-db

# Test PostgreSQL connection
docker compose exec kong-db psql -U kong -d kong -c "SELECT 1;"

# Restart Kong database
docker compose restart kong-db

# Run Kong migrations
docker compose exec kong kong migrations bootstrap
```

### 8. Frontend Issues

#### Frontend Not Loading
**Symptoms:**
- Frontend not accessible
- 404 errors
- Static files not serving

**Solutions:**
```bash
# Check Nginx status
docker compose ps nginx

# Check Nginx logs
docker compose logs nginx

# Test Nginx configuration
docker compose exec nginx nginx -t

# Check frontend build
docker compose logs frontend-build

# Restart Nginx
docker compose restart nginx
```

#### API Calls Failing
**Symptoms:**
- Frontend cannot call APIs
- CORS errors
- Authentication issues

**Solutions:**
```bash
# Check API endpoints
curl https://localhost/api/v1/stations/

# Check CORS headers
curl -H "Origin: https://localhost" -v https://localhost/api/v1/stations/

# Check authentication
curl -H "Authorization: Bearer <token>" https://localhost/api/v1/stations/

# Update frontend API URL
# Set REACT_APP_API_URL=https://localhost
```

## 🔧 Diagnostic Commands

### System Health Check
```bash
# Check all services
./scripts/monitoring.sh

# Check Docker containers
docker compose ps

# Check system resources
docker stats

# Check logs
docker compose logs -f
```

### Kong Diagnostics
```bash
# Kong status
curl http://localhost:8001/status

# Kong health
curl http://localhost:8001/health

# Kong services
curl http://localhost:8001/services

# Kong routes
curl http://localhost:8001/routes

# Kong plugins
curl http://localhost:8001/plugins
```

### Network Diagnostics
```bash
# Test internal connectivity
docker compose exec kong ping auth-backend
docker compose exec kong ping mysql

# Test external connectivity
docker compose exec kong ping 192.168.1.100

# Check DNS resolution
docker compose exec kong nslookup auth-backend
```

### Database Diagnostics
```bash
# MySQL diagnostics
docker compose exec mysql mysql -u root -proot -e "SHOW PROCESSLIST;"
docker compose exec mysql mysql -u root -proot -e "SHOW STATUS;"

# PostgreSQL diagnostics
docker compose exec kong-db psql -U kong -d kong -c "SELECT * FROM pg_stat_activity;"
```

## 📞 Support

If you're still experiencing issues:

1. **Check logs**: `docker compose logs -f`
2. **Run diagnostics**: `./scripts/monitoring.sh`
3. **Review configuration**: Check `.env` and Kong settings
4. **Test connectivity**: Verify network connections
5. **Contact support**: Provide logs and error messages

## 🔄 Recovery Procedures

### Complete System Reset
```bash
# Stop all services
docker compose down

# Remove volumes (WARNING: This will delete all data)
docker compose down -v

# Rebuild and restart
docker compose up -d --build

# Reconfigure Kong
./scripts/kong-production-setup.sh
./scripts/kong-jwt-setup.sh
```

### Partial Service Recovery
```bash
# Restart specific service
docker compose restart <service-name>

# Rebuild specific service
docker compose up -d --build <service-name>

# Check service health
curl http://localhost:8001/health
```

### Configuration Recovery
```bash
# Restore from backup
./scripts/backup.sh

# Reconfigure Kong
./scripts/kong-production-setup.sh

# Restart services
docker compose restart
```
