#!/bin/bash
# Provision a new FacturApp tenant on the VPS.
# Usage: ./add-tenant.sh <slug> <app_port> <db_port>
# Example: ./add-tenant.sh acmecorp 3001 5433
#
# Ports must be unique across all tenants. Keep a log in ~/tenants/PORTS.md.
# After running this script, follow the printed "Next steps".

set -euo pipefail

SLUG="${1:-}"
APP_PORT="${2:-}"
DB_PORT="${3:-}"
BASE_DOMAIN="${BASE_DOMAIN:-facturapp.siferone.com}"   # override with: BASE_DOMAIN=other.com ./add-tenant.sh ...

if [ -z "$SLUG" ] || [ -z "$APP_PORT" ] || [ -z "$DB_PORT" ]; then
  echo "Usage: $0 <slug> <app_port> <db_port>"
  echo "Example: $0 acmecorp 3001 5433"
  exit 1
fi

DOMAIN="${SLUG}.${BASE_DOMAIN}"
TENANT_DIR="$(dirname "$0")/../tenants/${SLUG}"
TENANT_DIR="$(realpath "${TENANT_DIR}" 2>/dev/null || echo "$HOME/tenants/${SLUG}")"

# Fall back to home-relative path when running on VPS
if [[ "$TENANT_DIR" != /home/* ]] && [[ "$TENANT_DIR" != /root/* ]]; then
  TENANT_DIR="$HOME/tenants/${SLUG}"
fi

if [ -d "$TENANT_DIR" ]; then
  echo "❌ Tenant '$SLUG' already exists at $TENANT_DIR"
  exit 1
fi

mkdir -p "$TENANT_DIR"

# Generate secure random secrets
DB_PASS=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# --- Write .env ---
cat > "$TENANT_DIR/.env" <<EOF
# FacturApp tenant: ${SLUG}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATABASE_URL=postgresql://facturapp:${DB_PASS}@db_${SLUG}:5432/facturapp
DB_PASSWORD=${DB_PASS}

NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
AUTH_SECRET=${AUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}

# Email — set one of these:
RESEND_API_KEY=re_REPLACE_ME
EMAIL_FROM=noreply@${DOMAIN}
# NODEMAILER_EMAIL=your@gmail.com
# NODEMAILER_PW=your_app_password
EOF

# --- Write docker-compose.yml ---
cat > "$TENANT_DIR/docker-compose.yml" <<EOF
services:
  app_${SLUG}:
    image: facturapp:latest
    container_name: app_${SLUG}
    restart: unless-stopped
    ports:
      - "${APP_PORT}:3000"
    env_file: .env
    depends_on:
      db_${SLUG}:
        condition: service_healthy
    networks:
      - net_${SLUG}

  db_${SLUG}:
    image: postgres:16-alpine
    container_name: db_${SLUG}
    restart: unless-stopped
    environment:
      POSTGRES_USER: facturapp
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: facturapp
    volumes:
      - pgdata_${SLUG}:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U facturapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - net_${SLUG}

volumes:
  pgdata_${SLUG}:

networks:
  net_${SLUG}:
    driver: bridge
EOF

# --- Write Nginx vhost template ---
cat > "$TENANT_DIR/nginx.conf" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
        client_max_body_size 10M;
    }
}
EOF

echo ""
echo "✅ Tenant '${SLUG}' provisioned at ${TENANT_DIR}"
echo "   Domain:    https://${DOMAIN}"
echo "   App port:  ${APP_PORT}"
echo "   DB port:   internal only (no host binding)"
echo ""
echo "Next steps:"
echo "  1. Edit ${TENANT_DIR}/.env — set RESEND_API_KEY (or NODEMAILER_* vars)"
echo ""
echo "  2. Start the stack:"
echo "     cd ${TENANT_DIR} && docker compose up -d"
echo ""
echo "  3. Run DB migrations:"
echo "     docker exec app_${SLUG} npx prisma migrate deploy"
echo ""
echo "  4. Create admin user:"
echo "     docker exec -it app_${SLUG} npm run create-admin"
echo ""
echo "  5. Install Nginx vhost:"
echo "     sudo cp ${TENANT_DIR}/nginx.conf /etc/nginx/sites-available/${DOMAIN}"
echo "     sudo ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  6. Obtain SSL certificate:"
echo "     sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo "  7. Verify:"
echo "     curl http://localhost:${APP_PORT}/api/health"
echo ""
echo "  8. Log this tenant in ~/tenants/PORTS.md:"
echo "     | ${SLUG} | ${APP_PORT} | internal | ${DOMAIN} |"
