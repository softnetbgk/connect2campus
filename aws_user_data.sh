#!/bin/bash
# AWS User Data Script to Auto-Install School App Environment
# Paste this into "Advanced Details -> User Data" when launching EC2 instance.

# 1. Update & Install Dependencies
apt update -y
apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs nginx git postgresql postgresql-contrib

# 2. Install PM2 Global
npm install -g pm2

# 3. Setup Postgres Database
# Create DB 'schooldb' and user 'schooluser' with password 'school123'
# SECURITY WARNING: CELL CHANGE PASSWORD AFTER SETUP
sudo -u postgres psql -c "CREATE DATABASE schooldb;"
sudo -u postgres psql -c "CREATE USER schooluser WITH ENCRYPTED PASSWORD 'school123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE schooldb TO schooluser;"

# 4. Clone Repository (Public) - Replace with your actual repo if private (requires keys)
# For now we create the directory structure
mkdir -p /home/ubuntu/SchoolSoftware
chown -R ubuntu:ubuntu /home/ubuntu/SchoolSoftware

# 5. Configure Nginx
cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /home/ubuntu/SchoolSoftware/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Restart Nginx
systemctl restart nginx

# 6. Success Flag
echo "Setup Complete" > /home/ubuntu/setup_complete.txt
