#!/bin/bash

echo "🔧 Setting up Kong Gateway configuration..."

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
until curl -sSf http://localhost:8001/status >/dev/null; do 
  echo "Kong not ready yet, waiting..."
  sleep 2
done

echo "✅ Kong is ready!"

# Create services
echo "Creating services..."

# Auth service
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "auth-service",
    "url": "http://auth-backend:8000"
  }' || echo "Auth service already exists"

# Admin service
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin-svc",
    "url": "http://admin-svc:3001"
  }' || echo "Admin service already exists"

# Rental service
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rental-svc",
    "url": "http://rental-svc:3002"
  }' || echo "Rental service already exists"

# Fleet service
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fleet-svc",
    "url": "http://fleet-svc:3003"
  }' || echo "Fleet service already exists"

# Create routes for auth service
echo "Creating routes..."

# Auth routes
curl -X POST http://localhost:8001/services/auth-service/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "auth-routes",
    "paths": ["/api/v1/auth", "/api/v1/users", "/api/v1/documents", "/api/v1/upload", "/api/v1/complaints"],
    "strip_path": false
  }' || echo "Auth routes already exist"

# Admin routes
curl -X POST http://localhost:8001/services/admin-svc/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin-routes",
    "paths": ["/api/v1/admin"],
    "strip_path": false
  }' || echo "Admin routes already exist"

# Rental routes
curl -X POST http://localhost:8001/services/rental-svc/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rental-routes",
    "paths": ["/api/v1/bookings"],
    "strip_path": false
  }' || echo "Rental routes already exist"

# Fleet routes
curl -X POST http://localhost:8001/services/fleet-svc/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fleet-routes",
    "paths": ["/api/v1/vehicles"],
    "strip_path": false
  }' || echo "Fleet routes already exist"

# Add CORS plugin globally
echo "Adding CORS plugin..."
curl -X POST http://localhost:8001/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cors",
    "config": {
      "origins": ["*"],
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      "headers": ["Accept", "Authorization", "Content-Type", "X-Requested-With", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"],
      "exposed_headers": ["Authorization", "Content-Type"],
      "credentials": true,
      "max_age": 3600,
      "preflight_continue": false
    }
  }' || echo "CORS plugin already exists"

# Add rate limiting plugin
echo "Adding rate limiting plugin..."
curl -X POST http://localhost:8001/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rate-limiting",
    "config": {
      "minute": 1000,
      "hour": 10000,
      "policy": "local"
    }
  }' || echo "Rate limiting plugin already exists"

echo "✅ Kong configuration completed!"
echo "Testing Kong setup..."

# Test Kong health
curl -s http://localhost:8001/status | jq . || echo "Kong health check failed"

# Test services
echo "Services:"
curl -s http://localhost:8001/services | jq '.data[].name' || echo "Services check failed"

# Test routes
echo "Routes:"
curl -s http://localhost:8001/routes | jq '.data[].name' || echo "Routes check failed"

echo "🎉 Kong Gateway setup completed successfully!"
