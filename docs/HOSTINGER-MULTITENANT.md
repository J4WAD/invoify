# FacturApp — Hostinger Multi-Tenant Deployment

Each client gets their own isolated Docker container (app) and PostgreSQL database running on a single Hostinger VPS. Nginx routes each subdomain to the right container.

```
Internet
   │
   ▼
Nginx (SSL termination)
   ├── client1.facturapp.dz ──► app_client1 :3001 ──► db_client1 (postgres)
   ├── client2.facturapp.dz ──► app_client2 :3002 ──► db_client2 (postgres)
   └── client3.facturapp.dz ──► app_client3 :3003 ──► db_client3 (postgres)
```

---

## PHASE 0 — Decisions Before You Start

### 1. Choose a Hostinger VPS Plan

| Plan | RAM | Tenants (est.) |
|------|-----|---------------|
| KVM 2 | 8 GB | ~5 |
| KVM 4 | 16 GB | ~15 |
| KVM 8 | 32 GB | ~35 |

Each tenant stack uses ~500 MB RAM idle.

### 2. Domain Strategy (pick one)

- **Subdomain per tenant** — `client1.facturapp.dz`, `client2.facturapp.dz`
  - Add a wildcard A record `*.facturapp.dz → VPS_IP` in your DNS zone
  - Get individual Let's Encrypt certs per subdomain (one `certbot` call each)

- **Client's own domain** — `client1.com`, `client2.com`
  - Client points their domain's A record to VPS_IP
  - Get a cert per domain with `certbot --nginx -d client1.com`

### 3. Accounts You Need

- Hostinger VPS account
- A domain (managed in Hostinger DNS or elsewhere)
- [Resend](https://resend.com) account for transactional email (free tier: 3 000 emails/month)
- GitHub account to host the repo (for VPS to `git clone`)

---

## PHASE 1 — Provision & Harden the VPS

In Hostinger panel: **VPS → Create → Ubuntu 22.04 LTS**, paste your SSH public key.

```bash
ssh root@<VPS_IP>

# Update system
apt update && apt upgrade -y
timedatectl set-timezone Africa/Algiers

# Non-root deploy user
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx

# Re-login as deploy
su - deploy
docker --version   # should print Docker version
```

---

## PHASE 2 — Deploy the App Image to the VPS

### Option A — Clone and build on the VPS (simpler)

```bash
# As deploy user on VPS
git clone https://github.com/YOUR_REPO/invoify.git ~/facturapp
cd ~/facturapp
docker build -t facturapp:latest .
```

Re-run `docker build` each time you push a new version.

### Option B — Docker Hub (for CI/CD)

On your local machine:
```bash
docker build -t YOUR_DOCKERHUB_USER/facturapp:latest .
docker push YOUR_DOCKERHUB_USER/facturapp:latest
```

On the VPS:
```bash
docker pull YOUR_DOCKERHUB_USER/facturapp:latest
docker tag YOUR_DOCKERHUB_USER/facturapp:latest facturapp:latest
```

---

## PHASE 3 — Set Up the Tenant Directory

```bash
# As deploy user on VPS
mkdir -p ~/tenants/shared-scripts

# Copy the provisioning scripts from the repo
cp ~/facturapp/deploy/add-tenant.sh ~/tenants/shared-scripts/
cp ~/facturapp/deploy/backup-all.sh ~/tenants/shared-scripts/
chmod +x ~/tenants/shared-scripts/*.sh

# Create the port log
cat > ~/tenants/PORTS.md <<'EOF'
# Tenant Port Allocation
| Slug | App Port | Domain |
|------|----------|--------|
EOF
```

---

## PHASE 4 — Onboard a New Tenant

Run this for **every new client**:

### 4.1 — Run the provisioning script

```bash
cd ~/tenants/shared-scripts

# Usage: ./add-tenant.sh <slug> <app_port> <db_port>
./add-tenant.sh acmecorp 3001 5433
```

This creates `~/tenants/acmecorp/` with:
- `.env` — auto-generated secrets + placeholder for RESEND_API_KEY
- `docker-compose.yml` — app + postgres on an isolated Docker network
- `nginx.conf` — ready-to-install Nginx vhost

### 4.2 — Set the email API key

```bash
nano ~/tenants/acmecorp/.env
# Set: RESEND_API_KEY=re_YOUR_KEY
```

### 4.3 — Start the stack

```bash
cd ~/tenants/acmecorp
docker compose up -d
docker compose logs -f   # watch until "Ready on http://0.0.0.0:3000"
```

### 4.4 — Run migrations

```bash
docker exec app_acmecorp npx prisma migrate deploy
```

### 4.5 — Create admin user

```bash
docker exec -it app_acmecorp npm run create-admin
# Interactive: enter name, email, password
```

### 4.6 — Verify the app responds

```bash
curl http://localhost:3001/api/health
# → {"status":"ok"}
```

---

## PHASE 5 — Configure Nginx + SSL

### 5.1 — Install the vhost

```bash
sudo cp ~/tenants/acmecorp/nginx.conf \
        /etc/nginx/sites-available/acmecorp.facturapp.dz
sudo ln -s /etc/nginx/sites-available/acmecorp.facturapp.dz \
           /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 — Obtain SSL certificate

```bash
sudo certbot --nginx -d acmecorp.facturapp.dz
# Certbot rewrites the vhost to redirect HTTP → HTTPS automatically
```

Verify auto-renewal is active:
```bash
sudo systemctl status certbot.timer
```

---

## PHASE 6 — DNS Setup in Hostinger

**Hostinger → Domains → DNS Zone → Manage DNS**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `<VPS_IP>` | 300 |
| A | `*` | `<VPS_IP>` | 300 |

The wildcard `*` record routes all subdomains (client1, client2, …) to the VPS. Individual certs are then issued per subdomain via `certbot`.

---

## PHASE 7 — Port Allocation (maintain this log)

Update `~/tenants/PORTS.md` after each new tenant:

```
| Slug       | App Port | Domain                     |
|------------|----------|----------------------------|
| acmecorp   | 3001     | acmecorp.facturapp.dz      |
| betacorp   | 3002     | betacorp.facturapp.dz      |
| gammacorp  | 3003     | gammacorp.facturapp.dz     |
```

DB containers are on isolated Docker networks — no host port binding needed for PostgreSQL.

---

## PHASE 8 — Update All Tenants to a New App Version

```bash
# 1. Pull latest code and rebuild image
cd ~/facturapp
git pull
docker build -t facturapp:latest .

# 2. Restart every tenant's app container with the new image
for dir in ~/tenants/*/; do
  slug=$(basename "$dir")
  [ "$slug" = "shared-scripts" ] && continue
  echo "Updating $slug..."
  cd "$dir"
  docker compose up -d --force-recreate "app_${slug}"
  docker exec "app_${slug}" npx prisma migrate deploy
done
```

---

## PHASE 9 — Automated Backups

```bash
# Schedule nightly backup at 03:00
crontab -e
# Add this line:
0 3 * * * /home/deploy/tenants/shared-scripts/backup-all.sh >> /home/deploy/backups/backup.log 2>&1
```

The script (`deploy/backup-all.sh`) dumps every tenant's PostgreSQL database, gzips it to `~/backups/YYYY-MM-DD/<slug>.sql.gz`, and deletes backups older than 30 days.

**Restore a single tenant:**
```bash
zcat ~/backups/2025-01-15/acmecorp.sql.gz \
  | docker exec -i db_acmecorp psql -U facturapp facturapp
```

---

## PHASE 10 — Post-Deploy Checklist (per tenant)

- [ ] `https://DOMAIN/api/health` → `{"status":"ok"}`
- [ ] Login page loads without errors
- [ ] Admin credentials work
- [ ] Invoice form: French labels visible, DZD currency selected by default
- [ ] PDF generation: click "Generate PDF", file downloads in ~3–5 s
- [ ] Email: send a test invoice, verify delivery
- [ ] SSL: no browser warning, cert valid for 90 days
- [ ] Isolation: log into tenant A, confirm tenant B's data is not visible

---

## Quick Reference — Useful Commands

```bash
# Status of all tenant containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs for a specific tenant
docker compose -f ~/tenants/acmecorp/docker-compose.yml logs -f

# Shell into app container
docker exec -it app_acmecorp sh

# Stop a tenant
cd ~/tenants/acmecorp && docker compose down

# Remove a tenant completely (DESTRUCTIVE — deletes all data)
cd ~/tenants/acmecorp
docker compose down -v          # stops containers + removes volumes
cd ~ && rm -rf ~/tenants/acmecorp
sudo rm /etc/nginx/sites-enabled/acmecorp.facturapp.dz
sudo rm /etc/nginx/sites-available/acmecorp.facturapp.dz
sudo systemctl reload nginx
```
