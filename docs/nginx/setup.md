---
title: Setup
description: Setup Nginx with modern security best practices.
id : setup
---
## 1. Initial Setup and Security

### Update System
```bash
# For Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# For CentOS/RHEL
sudo yum update -y
```

### Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install epel-release -y
sudo yum install nginx -y
```

## 2. Secure Nginx Configuration

### Create Secure Configuration File
```bash
sudo nano /etc/nginx/conf.d/secure.conf
```

Add this configuration:

```nginx
# Secure Nginx Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_trusted_certificate /path/to/your/chain.crt;
    
    # Modern SSL Configuration
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA128:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-SHA256;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Additional Security Headers (optional)
    add_header Feature-Policy "geolocation 'none'; microphone 'none'; camera 'none'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Root Directory and Index
    root /var/www/html;
    index index.html index.htm;
    
    # Security-Related Location Blocks
    location / {
        try_files $uri $uri/ =404;
        
        # Hide Nginx Version
        server_tokens off;
    }
    
    # Hide sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Security rules for common vulnerabilities
    location ~ \.(env|ini|log|sh|sql|bak|old|orig|save|tmp)$ {
        deny all;
        return 404;
    }
    
    # Rate limiting for API endpoints (if needed)
    location /api/ {
        limit_req zone=api burst=5 nodelay;
        proxy_pass http://backend;
    }
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}
```

## 3. Enhanced Security Configuration

### Create a More Comprehensive Security Config
```bash
sudo nano /etc/nginx/snippets/security.conf
```

```nginx
# Security headers and configurations
map $http_user_agent $blocked_agent {
    default "";
    "~*curl" "blocked";
    "~*wget" "blocked";
    "~*python-requests" "blocked";
}

# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; font-src 'self' https: data:; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Download-Options "noopen" always;
add_header X-Permitted-Cross-Domain-Policies "none" always;

# Hide version information
server_tokens off;
```

## 4. Advanced Security Configuration

### Create Additional Security Snippets
```bash
sudo nano /etc/nginx/snippets/ssl.conf
```

```nginx
# SSL Configuration with modern security practices
ssl_protocols TLSv1.3 TLSv1.2;
ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Certificate Transparency
add_header Expect-CT "max-age=86400; enforce" always;
```

## 5. Firewall Setup

### Configure UFW (Uncomplicated Firewall)
```bash
# Install ufw if not present
sudo apt install ufw -y

# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Check status
sudo ufw status
```

## 6. Certificate Management (Let's Encrypt)

### Install Certbot
```bash
# For Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# For CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### Get SSL Certificate
```bash
# For Ubuntu/Debian
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or for manual setup
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

## 7. Complete Nginx Configuration

### Main nginx.conf (Enhanced Security)
```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic security and performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # SSL Security
    include /etc/nginx/snippets/ssl.conf;
    include /etc/nginx/snippets/security.conf;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Limit request size
    client_max_body_size 10M;
    
    # Limit concurrent connections
    limit_req_zone $binary_remote_addr zone=conn:10m rate=10r/s;
    
    # Main server block
    include /etc/nginx/conf.d/*.conf;
}
```

## 8. Testing and Validation

### Test Configuration
```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Security Testing
```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check security headers
curl -I https://yourdomain.com
```

## 9. Additional Security Measures

### Create Security Monitoring Script
```bash
sudo nano /usr/local/bin/nginx-security-check.sh
```

```bash
#!/bin/bash
# Security check for nginx

echo "=== Nginx Security Check ==="

# Check nginx version
echo "Nginx Version:"
nginx -v 2>&1

# Check configuration syntax
echo "Configuration Syntax:"
nginx -t

# Check for open ports
echo "Open Ports:"
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check file permissions
echo "Nginx Config Permissions:"
ls -la /etc/nginx/

echo "=== Security Check Complete ==="
```

### Make it executable
```bash
sudo chmod +x /usr/local/bin/nginx-security-check.sh
```

## 10. Regular Maintenance

### Set up automatic security updates
```bash
# Configure unattended upgrades (Ubuntu/Debian)
sudo apt install unattended-upgrades -y
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Add these lines:
# Unattended-Upgrade::Origins-Pattern {
#     "origin=Ubuntu,family=Ubuntu,release=jammy,component=main,archive=jammy";
# };
```

## 11. Final Steps

### Restart Services
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx

# Set up automatic security updates
sudo systemctl enable unattended-upgrades
```

### Verify Setup
```bash
# Check nginx is running with security headers
curl -I https://yourdomain.com

# Test security headers are present
curl -I https://yourdomain.com | grep -E "(X-Frame|X-XSS|Strict-Transport)"
```

## Key Security Features Implemented:

1. **Modern TLS Configuration** - TLS 1.3 and 1.2 support
2. **Secure Cipher Suites** - Strong encryption only
3. **Security Headers** - X-Frame-Options, XSS protection, etc.
4. **Rate Limiting** - Prevents abuse and DDoS attacks
5. **File Protection** - Hides sensitive files
6. **HTTP to HTTPS Redirect** - Forces secure connections
7. **Firewall Integration** - Proper port management
8. **Certificate Management** - Let's Encrypt support

This configuration provides enterprise-level security for your nginx server while maintaining good performance and modern web standards.