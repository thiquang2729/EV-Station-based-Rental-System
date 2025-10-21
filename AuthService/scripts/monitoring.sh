#!/bin/bash
# Kong API Gateway Monitoring Script

set -e

echo "📊 Kong API Gateway Monitoring"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check Kong Gateway Status
echo ""
print_info "🔍 Kong Gateway Status:"
if curl -s http://localhost:8001/status > /dev/null; then
    print_status "Kong Gateway is running"
    echo "   Kong Status:"
    curl -s http://localhost:8001/status | jq '.' 2>/dev/null || echo "   Status: OK (jq not available)"
else
    print_error "Kong Gateway is not responding"
fi

# Check Services
echo ""
print_info "📋 Kong Services:"
if curl -s http://localhost:8001/services > /dev/null; then
    echo "   Services configured:"
    curl -s http://localhost:8001/services | jq '.data[].name' 2>/dev/null || echo "   Services: Available (jq not available)"
else
    print_error "Cannot fetch services"
fi

# Check Routes
echo ""
print_info "🛣️ Kong Routes:"
if curl -s http://localhost:8001/routes > /dev/null; then
    echo "   Routes configured:"
    curl -s http://localhost:8001/routes | jq '.data[].name' 2>/dev/null || echo "   Routes: Available (jq not available)"
else
    print_error "Cannot fetch routes"
fi

# Check Plugins
echo ""
print_info "🔌 Kong Plugins:"
if curl -s http://localhost:8001/plugins > /dev/null; then
    echo "   Plugins enabled:"
    curl -s http://localhost:8001/plugins | jq '.data[].name' 2>/dev/null || echo "   Plugins: Available (jq not available)"
else
    print_error "Cannot fetch plugins"
fi

# Check Health Checks
echo ""
print_info "🏥 Health Checks:"
if curl -s http://localhost:8001/health > /dev/null; then
    echo "   Health check status:"
    curl -s http://localhost:8001/health | jq '.' 2>/dev/null || echo "   Health: Available (jq not available)"
else
    print_error "Cannot fetch health status"
fi

# Check Docker Services
echo ""
print_info "🐳 Docker Services:"
echo "   Container Status:"
docker compose ps

# Check Nginx
echo ""
print_info "🌐 Nginx Status:"
if curl -f http://localhost/healthz > /dev/null; then
    print_status "Nginx is running"
else
    print_error "Nginx is not responding"
fi

# Check Auth Service
echo ""
print_info "🔐 Auth Service Status:"
if curl -f http://localhost:8003/api/v1/health > /dev/null; then
    print_status "Auth Service is running"
else
    print_warning "Auth Service is not responding"
fi

# Check Kong Manager
echo ""
print_info "🔧 Kong Manager:"
if curl -f http://localhost:8002 > /dev/null; then
    print_status "Kong Manager is accessible"
    echo "   URL: http://localhost:8002"
else
    print_error "Kong Manager is not accessible"
fi

# Check SSL
echo ""
print_info "🔒 SSL Status:"
if curl -k -f https://localhost/healthz > /dev/null; then
    print_status "SSL is working"
else
    print_warning "SSL may not be configured or working"
fi

# Performance Metrics
echo ""
print_info "📈 Performance Metrics:"
echo "   Kong Proxy: http://localhost:8000"
echo "   Kong Admin: http://localhost:8001"
echo "   Kong Manager: http://localhost:8002"
echo "   Frontend: https://localhost"
echo "   Auth Service: http://localhost:8003"

# Log Files
echo ""
print_info "📝 Log Files:"
echo "   Kong logs: docker compose logs kong"
echo "   Nginx logs: docker compose logs nginx"
echo "   Auth logs: docker compose logs auth-backend"
echo "   All logs: docker compose logs -f"

# API Test
echo ""
print_info "🧪 API Testing:"
echo "   Test Kong Proxy: curl http://localhost:8000/status"
echo "   Test Auth API: curl http://localhost:8000/api/v1/auth/health"
echo "   Test Station API: curl http://localhost:8000/api/v1/stations/"

echo ""
print_status "Monitoring completed! 🎉"
