# CMRG Survey — Self-Hosted Production Deployment Guide

**Target Audience:** CMRG IT Infrastructure & DevOps Engineers  
**System Architecture:** Self-Hosted Django 5.0 + DRF + PostgreSQL 16 + React 18 / Vite  
**License & Cost:** 100% Owned by CMRG Ltd. Zero Cloud Fees. Zero Per-Submission Licensing.

---

## 1. System Requirements

### Hardware Specification (CMRG On-Premises or Cloud VPS)
- **CPU:** 4+ Cores (AMD EPYC or Intel Xeon recommended)
- **RAM:** 8 GB minimum (16 GB recommended for >50 simultaneous enumerators)
- **Storage:** 100 GB NVMe SSD with automated weekly snapshots
- **OS:** Ubuntu 22.04 LTS / Debian 12 / RHEL 9

---

## 2. Fast Deployment via Docker Compose (Recommended)

### Step 1: Clone or Transfer Repository
```bash
git clone https://github.com/cmrg-fieldwork/cmrg-survey-studio.git /opt/cmrg-survey
cd /opt/cmrg-survey/django_backend
```

### Step 2: Configure Environment Variables
Copy `.env.django` and update production secrets:
```bash
cp .env.django .env
nano .env
```
Ensure you update:
- `DJANGO_SECRET_KEY`: Set to a cryptographically random 64-character secret
- `POSTGRES_PASSWORD`: Set strong database password
- `SIMPLE_JWT_SIGNING_KEY`: Set token signing secret
- `ALLOWED_HOSTS`: Add `survey.cmrg.org` and your server IP

### Step 3: Launch Containers
```bash
docker compose up -d --build
```
This automatically initiates:
- PostgreSQL 16 Alpine container with isolated volume persistence
- Django 5.0 Gunicorn application container
- Static file collection and database migrations

### Step 4: Create Superuser Administrator
```bash
docker compose exec backend python manage.py createsuperuser
```

---

## 3. Nginx Reverse Proxy & SSL Setup

Install Nginx and Certbot for HTTPS termination:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/survey.cmrg.org`:
```nginx
server {
    server_name survey.cmrg.org;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 100M;
}
```

Enable SSL:
```bash
sudo certbot --nginx -d survey.cmrg.org
```

---

## 4. Automated Database Backups

Add a nightly automated backup cron job:
```bash
0 2 * * * docker compose -f /opt/cmrg-survey/django_backend/docker-compose.yml exec -T db pg_dump -U cmrg_admin cmrg_survey | gzip > /opt/backups/cmrg_survey_$(date +\%F).sql.gz
```
Keep backups for 30 days and replicate offsite to an encrypted storage mount.
