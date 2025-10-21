#!/bin/bash
# Kong API Gateway Backup Script

set -e

echo "💾 Kong API Gateway Backup Script"
echo "================================="

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

# Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_info "Creating backup directory: $BACKUP_DIR"

# Backup Kong configuration
print_info "📋 Backing up Kong configuration..."
curl -s http://localhost:8001/services > "$BACKUP_DIR/kong-services.json" || print_warning "Could not backup services"
curl -s http://localhost:8001/routes > "$BACKUP_DIR/kong-routes.json" || print_warning "Could not backup routes"
curl -s http://localhost:8001/plugins > "$BACKUP_DIR/kong-plugins.json" || print_warning "Could not backup plugins"
curl -s http://localhost:8001/consumers > "$BACKUP_DIR/kong-consumers.json" || print_warning "Could not backup consumers"

# Backup environment variables
print_info "🔧 Backing up environment variables..."
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/env.backup"
    print_status "Environment variables backed up"
else
    print_warning "No .env file found"
fi

# Backup Nginx configuration
print_info "🌐 Backing up Nginx configuration..."
if [ -f ./nginx/nginx.conf ]; then
    cp ./nginx/nginx.conf "$BACKUP_DIR/nginx.conf.backup"
    print_status "Nginx configuration backed up"
else
    print_warning "No nginx.conf found"
fi

# Backup Docker Compose
print_info "🐳 Backing up Docker Compose..."
if [ -f docker-compose.yml ]; then
    cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml.backup"
    print_status "Docker Compose backed up"
else
    print_warning "No docker-compose.yml found"
fi

# Backup SSL certificates
print_info "🔒 Backing up SSL certificates..."
if [ -d ./nginx/ssl ]; then
    cp -r ./nginx/ssl "$BACKUP_DIR/ssl"
    print_status "SSL certificates backed up"
else
    print_warning "No SSL certificates found"
fi

# Backup database (if running)
print_info "🗄️ Backing up databases..."
if docker compose ps mysql | grep -q "Up"; then
    print_info "Backing up MySQL database..."
    docker compose exec mysql mysqldump -u root -proot authdb > "$BACKUP_DIR/authdb.sql" || print_warning "Could not backup MySQL database"
else
    print_warning "MySQL container is not running"
fi

if docker compose ps kong-db | grep -q "Up"; then
    print_info "Backing up Kong PostgreSQL database..."
    docker compose exec kong-db pg_dump -U kong kong > "$BACKUP_DIR/kong-db.sql" || print_warning "Could not backup Kong database"
else
    print_warning "Kong database container is not running"
fi

# Create backup manifest
print_info "📄 Creating backup manifest..."
cat > "$BACKUP_DIR/backup-manifest.txt" << EOF
Kong API Gateway Backup
======================
Date: $(date)
Backup Directory: $BACKUP_DIR

Contents:
- kong-services.json: Kong services configuration
- kong-routes.json: Kong routes configuration
- kong-plugins.json: Kong plugins configuration
- kong-consumers.json: Kong consumers configuration
- env.backup: Environment variables
- nginx.conf.backup: Nginx configuration
- docker-compose.yml.backup: Docker Compose configuration
- ssl/: SSL certificates
- authdb.sql: MySQL database backup
- kong-db.sql: Kong PostgreSQL database backup

Restore Instructions:
1. Copy files back to their original locations
2. Restore databases: docker compose exec mysql mysql -u root -proot authdb < authdb.sql
3. Restore Kong: docker compose exec kong-db psql -U kong kong < kong-db.sql
4. Restart services: docker compose restart
EOF

print_status "Backup manifest created"

# Compress backup
print_info "📦 Compressing backup..."
cd "$BACKUP_DIR/.."
tar -czf "$(basename "$BACKUP_DIR").tar.gz" "$(basename "$BACKUP_DIR")"
print_status "Backup compressed: $(basename "$BACKUP_DIR").tar.gz"

# Clean up uncompressed directory
rm -rf "$(basename "$BACKUP_DIR")"

print_status "✅ Backup completed successfully!"
echo ""
echo "📁 Backup location: $BACKUP_DIR.tar.gz"
echo "📄 Manifest: $BACKUP_DIR/backup-manifest.txt"
echo ""
print_info "To restore from backup:"
echo "1. Extract: tar -xzf $(basename "$BACKUP_DIR").tar.gz"
echo "2. Follow instructions in backup-manifest.txt"
