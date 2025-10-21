#!/bin/bash

echo "🔧 Testing Kong Gateway Configuration..."

# Test Kong health
echo "1. Testing Kong health..."
curl -s http://localhost:8001/status | jq . || echo "Kong health check failed"

# Test Kong services
echo -e "\n2. Testing Kong services..."
curl -s http://localhost:8001/services | jq . || echo "Services check failed"

# Test Kong routes
echo -e "\n3. Testing Kong routes..."
curl -s http://localhost:8001/routes | jq . || echo "Routes check failed"

# Test Kong plugins
echo -e "\n4. Testing Kong plugins..."
curl -s http://localhost:8001/plugins | jq . || echo "Plugins check failed"

# Test API endpoints
echo -e "\n5. Testing API endpoints..."

# Test auth endpoint
echo "Testing auth endpoint..."
curl -v -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  2>&1 | head -20

# Test OPTIONS request (CORS preflight)
echo -e "\nTesting CORS preflight..."
curl -v -X OPTIONS http://localhost:8000/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>&1 | head -20

echo -e "\n✅ Kong Gateway test completed!"
