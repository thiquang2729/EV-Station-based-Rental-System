#!/bin/bash
# Generate SSL certificates for development

echo "🔐 Generating SSL certificates for development..."

# Create self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=VN/ST=HCM/L=HoChiMinh/O=EV-Rental/OU=IT/CN=localhost"

echo "✅ SSL certificates generated!"
echo "📁 Certificate: ./nginx/ssl/cert.pem"
echo "🔑 Private Key: ./nginx/ssl/key.pem"
echo "⚠️  Note: These are self-signed certificates for development only!"
echo "🔒 For production, use certificates from a trusted CA."
