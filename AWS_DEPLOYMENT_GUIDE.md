# AWS Deployment Guide (The "All-in-One" Strategy)

If you want to move everything to **AWS**, the most cost-effective method (often **Free** for 12 months with AWS Free Tier) is to put the Frontend, Backend, and Database all on a **single EC2 Instance**.

## Strategy: "The Monolith" (Cheapest & Fastest)
Instead of paying for separate services (RDS, Amplify, etc.), we run everything on one Linux server (Ubuntu).

- **Server**: AWS EC2 (t2.micro or t3.micro - Free Tier eligible).
- **OS**: Ubuntu 22.04 LTS.
- **Software**: Node.js, Nginx, PostgreSQL.

---

## Step-by-Step Instructions

### 1. Launch Instance
1.  Log in to AWS Console -> **EC2** -> **Launch Instance**.
2.  **Name**: `SchoolApp-Server`.
3.  **OS**: Ubuntu Server 22.04 LTS.
4.  **Instance Type**: `t2.micro` (Free Tier).
5.  **Key Pair**: Create new (e.g., `myschoolkey.pem`) and download it.
6.  **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443).

### 2. Connect to Server
Use SSH via terminal (Git Bash or Powershell):
```bash
ssh -i path/to/myschoolkey.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 3. Install Software
Run these commands inside the server:
```bash
# Update
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (Web Server)
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### 4. Configure Database
```bash
sudo -u postgres psql
# Inside SQL prompt:
CREATE DATABASE schooldb;
CREATE USER schooluser WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE schooldb TO schooluser;
\q
```

### 5. Upload Code (Use Git)
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/SchoolSoftware.git
cd SchoolSoftware
```

### 6. Setup Backend
```bash
cd backend
npm install
# Create .env file with DB creds
nano .env 
# Paste your ENV variables (DB_HOST=localhost, DB_USER=schooluser, etc.)
# Exit nano (Ctrl+X, Y, Enter)

# Start Backend
pm2 start src/server.js --name "school-backend"
```

### 7. Setup Frontend
```bash
cd ../frontend
npm install
npm run build
# The build is now in frontend/dist
```

### 8. Configure Nginx (The Bridge)
This makes your app accessible via the web IP.
```bash
sudo nano /etc/nginx/sites-available/default
```
**Replace content with:**
```nginx
server {
    listen 80;
    server_name _; # Or your domain.com

    # Frontend (Static Files)
    location / {
        root /home/ubuntu/SchoolSoftware/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend (API Proxy)
    location /api {
        proxy_pass http://localhost:5000; # Assuming backend runs on 5000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9. Restart Nginx
```bash
sudo systemctl restart nginx
```

## Result
*   Your app is live at `http://YOUR_EC2_PUBLIC_IP`.
*   **Frontend**: Served instantly by Nginx.
*   **Backend**: Running locally on port 5000.
*   **Database**: Running locally.

## Domain & SSL (Optional)
To make it secure (`https://`):
1.  Buy a domain (Namecheap/GoDaddy).
2.  Point "A Record" to your EC2 IP.
3.  Run `sudo apt install certbot python3-certbot-nginx`.
4.  Run `sudo certbot --nginx`.
