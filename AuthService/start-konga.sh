#!/bin/bash

echo "🚀 Starting Konga GUI for Kong Gateway management..."

# Start Konga service
echo "Starting Konga container..."
docker-compose -f docker-compose.kong.yml up -d konga

# Wait for Konga to be ready
echo "Waiting for Konga to be ready..."
until curl -sSf http://localhost:1337 >/dev/null; do 
  echo "Konga not ready yet, waiting..."
  sleep 3
done

echo "✅ Konga is ready!"
echo ""
echo "🌐 Access Konga GUI at: http://localhost:1337"
echo ""
echo "📋 Konga Setup Instructions:"
echo "1. Open http://localhost:1337 in your browser"
echo "2. Click 'Create new connection'"
echo "3. Fill in the connection details:"
echo "   - Name: Kong Gateway"
echo "   - Kong Admin URL: http://kong:8001"
echo "   - Kong Admin API Username: (leave empty)"
echo "   - Kong Admin API Password: (leave empty)"
echo "4. Click 'Create Connection'"
echo "5. You can now manage your Kong Gateway through the GUI!"
echo ""
echo "🔧 Available services in Konga:"
echo "- Services: Manage backend services"
echo "- Routes: Configure API routing"
echo "- Plugins: Add/remove plugins (CORS, Rate Limiting, etc.)"
echo "- Consumers: Manage API consumers"
echo "- Certificates: SSL/TLS certificates"
echo "- Upstreams: Load balancing configuration"
echo ""
echo "🎉 Konga GUI is now running!"
