#!/bin/bash
# EC2 Security Hardening Script
# Run this on your EC2 instance after initial setup

echo "🔒 Starting EC2 Security Hardening..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# 2. Configure UFW Firewall
echo "🛡️ Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
sudo ufw status verbose

# 3. Install and Configure Fail2Ban
echo "🚫 Installing Fail2Ban..."
sudo apt install -y fail2ban

# Create Fail2Ban configuration
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 3
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# 4. Disable Password Authentication (SSH Key Only)
echo "🔑 Configuring SSH security..."
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 5. Install Automatic Security Updates
echo "🔄 Enabling automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 6. Set up Log Rotation
echo "📝 Configuring log rotation..."
sudo tee /etc/logrotate.d/schoolapp > /dev/null <<EOF
/home/ubuntu/SchoolSoftware/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
EOF

# 7. Create logs directory
mkdir -p /home/ubuntu/SchoolSoftware/backend/logs
chown -R ubuntu:ubuntu /home/ubuntu/SchoolSoftware

echo "✅ Security hardening complete!"
echo ""
echo "🔍 Security Status:"
sudo ufw status
sudo fail2ban-client status sshd
echo ""
echo "⚠️  IMPORTANT: Make sure you have SSH key access before logging out!"
