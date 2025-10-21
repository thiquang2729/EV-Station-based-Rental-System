#!/bin/bash
# Kong API Gateway Production Deployment Script

set -e

echo "🚀 Deploying Kong API Gateway Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f env.example ]; then
        cp env.example .env
        print_warning "Please update .env file with your production values!"
    else
        print_error "env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
print_status "Loading environment variables..."
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')

# Generate SSL certificates if they don't exist
if [ ! -f ./nginx/ssl/cert.pem ] || [ ! -f ./nginx/ssl/key.pem ]; then
    print_status "Generating SSL certificates..."
    chmod +x ./nginx/ssl/generate-ssl.sh
    ./nginx/ssl/generate-ssl.sh
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down || true

# Build and start services
print_status "Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check Kong health
print_status "Checking Kong health..."
until curl -s http://localhost:8001/status > /dev/null; do
    print_status "Waiting for Kong to be ready..."
    sleep 5
done

print_status "Kong is ready!"

# Run Kong setup
print_status "Setting up Kong services and routes..."
chmod +x ./scripts/kong-production-setup.sh
./scripts/kong-production-setup.sh

# Setup JWT authentication
print_status "Setting up JWT authentication..."
chmod +x ./scripts/kong-jwt-setup.sh
./scripts/kong-jwt-setup.sh

# Verify deployment
print_status "Verifying deployment..."

# Check Kong status
if curl -f http://localhost:8001/status > /dev/null; then
    print_status "✅ Kong Gateway is running"
else
    print_error "❌ Kong Gateway is not responding"
    exit 1
fi

# Check Nginx health
if curl -f http://localhost/healthz > /dev/null; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx is not responding"
    exit 1
fi

# Check Auth Service
if curl -f http://localhost:8003/api/v1/health > /dev/null; then
    print_status "✅ Auth Service is running"
else
    print_warning "⚠️  Auth Service is not responding (may need time to start)"
fi

print_status "🎉 Deployment completed successfully!"
echo ""
echo "🌐 Services:"
echo "   - Frontend: https://localhost"
echo "   - Kong Proxy: http://localhost:8000"
echo "   - Kong Manager: http://localhost:8002"
echo "   - Kong Admin API: http://localhost:8001"
echo "   - Auth Service: http://localhost:8003"
echo ""
echo "📊 Monitoring:"
echo "   - Run './scripts/monitoring.sh' to check service status"
echo "   - Check logs with 'docker compose logs -f'"
echo ""
echo "🔧 Management:"
echo "   - Kong Manager: http://localhost:8002 (Admin UI)"
echo "   - Kong Admin API: http://localhost:8001 (API)"
echo ""
print_status "Deployment completed! 🚀"
