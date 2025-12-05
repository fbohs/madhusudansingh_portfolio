---
title: Logging
description: Setup Nginx Logging with modern security best practices.
id : logging
---
# NGINX Security Logging Setup - Advanced Configuration Guide

## Table of Contents
1. [Standard Practices](#standard-practices)
2. [Advanced Practices](#advanced-practices)
3. [Security Logging Configuration](#security-logging-configuration)
4. [Rate Limiting Implementation](#rate-limiting-implementation)
5. [Monitoring and Alerting](#monitoring-and-alerting)

---

## Standard Practices

### 1. Basic Security Logging Configuration

```nginx
# Basic security logging setup
error_log /var/log/nginx/error.log warn;
access_log /var/log/nginx/access.log combined;

# Security headers in access logs
log_format security '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';

# Apply security logging format
access_log /var/log/nginx/security.log security;
```

### 2. Log Rotation Configuration

```bash
# /etc/logrotate.d/nginx-security
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 3. Security Log Format

```nginx
# Enhanced security logging format with comprehensive fields
log_format security_extended '$remote_addr - $remote_user [$time_local] '
                           '"$request" $status $body_bytes_sent '
                           '"$http_referer" "$http_user_agent" '
                           '"$http_x_forwarded_for" "$http_x_real_ip" '
                           'rt=$request_time uct="$upstream_connect_time" '
                           'uht="$upstream_header_time" urt="$upstream_response_time" '
                           'ssl_cipher="$ssl_cipher" ssl_protocol="$ssl_protocol"';

# Security audit logging
log_format security_audit '$time_local - $remote_addr [$http_x_forwarded_for] '
                         '"$request" $status $body_bytes_sent '
                         'ua="$http_user_agent" ref="$http_referer" '
                         'method="$request_method" host="$host" ';
```

### 4. Security Log Levels

```nginx
# Configure appropriate log levels for security monitoring
error_log /var/log/nginx/error.log warn;
error_log /var/log/nginx/security_errors.log error;

# Security-specific error logging
server {
    error_log /var/log/nginx/security_error.log error;
    
    # Security warnings with context
    error_log /var/log/nginx/security_warnings.log warn;
}
```

---

## Advanced Practices

### 1. Advanced Rate Limiting Configuration

```nginx
# Advanced rate limiting with multiple zones
http {
    # Basic rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_rate:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_rate:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=general_rate:10m rate=20r/s;
    
    # Advanced zones with different parameters
    limit_req_zone $binary_remote_addr zone=burst_zone:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=strict_zone:10m rate=5r/s;
    
    # IP-based and user-agent rate limiting
    limit_req_zone $binary_remote_addr:$http_user_agent zone=ua_rate:10m rate=2r/s;
    
    # Cloudflare and proxy IP handling
    geo $real_ip {
        default 0.0.0.0/0;
        10.0.0.0/8 127.0.0.1;
        172.16.0.0/12 127.0.0.1;
        192.168.0.0/16 127.0.0.1;
    }
    
    # Geo-based rate limiting
    limit_req_zone $geoip_country zone=country_rate:10m rate=5r/s;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # API rate limiting with burst and delay
    location /api/ {
        limit_req zone=api_rate burst=20 nodelay;
        limit_req zone=burst_zone burst=30 delay=10;
        
        # Advanced API security
        limit_req_status 429;
        limit_req_log_level warn;
        
        proxy_pass http://backend_api;
    }
    
    # Login endpoint protection
    location /login/ {
        limit_req zone=login_rate burst=5 nodelay;
        limit_req zone=strict_zone burst=10 delay=5;
        
        # Return 429 for rate limit exceeded
        limit_req_status 429;
        limit_req_log_level error;
        
        proxy_pass http://auth_backend;
    }
    
    # General protection
    location / {
        limit_req zone=general_rate burst=30 nodelay;
        
        # Additional security headers
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "DENY";
        add_header X-XSS-Protection "1; mode=block";
        
        proxy_pass http://backend;
    }
}
```

### 2. Advanced Logging with Context

```nginx
# Comprehensive security logging with context information
log_format security_context '$time_local [$msec] '
                           'ip="$remote_addr" '
                           'method="$request_method" '
                           'uri="$uri" '
                           'query="$query_string" '
                           'status=$status '
                           'size=$body_bytes_sent '
                           'ua="$http_user_agent" '
                           'ref="$http_referer" '
                           'forwarded="$http_x_forwarded_for" '
                           'real_ip="$http_x_real_ip" '
                           'client_cert="$ssl_client_cert" '
                           'cipher="$ssl_cipher" '
                           'protocol="$ssl_protocol" '
                           'rt=$request_time '
                           'upstream_time=$upstream_response_time '
                           'geoip_country="$geoip_country_code" '
                           'geoip_region="$geoip_region_name" '
                           'geoip_city="$geoip_city_name"';

# Security logging with security context
access_log /var/log/nginx/security_context.log security_context;

# Detailed error logging for security events
error_log /var/log/nginx/security_events.log error;
```

### 3. Advanced Rate Limiting with Multiple Stages

```nginx
# Two-stage rate limiting for enhanced security
http {
    # Stage 1: High burst, low rate (allow normal browsing)
    limit_req_zone $binary_remote_addr zone=stage1:10m rate=5r/s;
    
    # Stage 2: Moderate rate with strict limits (for sensitive endpoints)
    limit_req_zone $binary_remote_addr zone=stage2:10m rate=2r/s;
    
    # Stage 3: Strict limits for critical resources
    limit_req_zone $binary_remote_addr zone=stage3:10m rate=1r/s;
    
    # Rate limiting with user-agent differentiation
    limit_req_zone $binary_remote_addr:$http_user_agent zone=ua_specific:10m rate=3r/s;
    
    # Rate limiting based on client capabilities
    limit_req_zone $binary_remote_addr zone=mobile_rate:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=desktop_rate:10m rate=30r/s;
}

server {
    # Mobile device rate limiting
    location /api/mobile/ {
        if ($http_user_agent ~* "Mobile|Android|iPhone") {
            limit_req zone=mobile_rate burst=15 nodelay;
        }
        
        # Desktop rate limiting
        if ($http_user_agent ~* "Desktop|Windows|Mac") {
            limit_req zone=desktop_rate burst=30 nodelay;
        }
        
        proxy_pass http://mobile_backend;
    }
    
    # Two-stage rate limiting for API endpoints
    location /api/v2/ {
        limit_req zone=stage1 burst=20 delay=10;
        limit_req zone=stage2 burst=5 delay=3;
        
        # Log detailed rate limiting information
        limit_req_log_level info;
        limit_req_status 429;
        
        proxy_pass http://api_backend;
    }
}
```

### 4. Enhanced Security Logging with Filtering

```nginx
# Security logging with IP filtering and content scanning
log_format security_filtered '$time_local [$msec] '
                            'ip="$remote_addr" '
                            'method="$request_method" '
                            'uri="$uri" '
                            'status=$status '
                            'size=$body_bytes_sent '
                            'ua="$http_user_agent" '
                            'ref="$http_referer" '
                            'forwarded="$http_x_forwarded_for" '
                            'scan_result="$http_x_security_scan"';

# Security logging with IP address filtering
server {
    # Log only security-relevant requests
    access_log /var/log/nginx/security_filtered.log security_filtered;
    
    # Filter and log specific threat patterns
    location ~* \.(php|asp|aspx|jsp|cgi) {
        # Log suspicious file access attempts
        access_log /var/log/nginx/suspicious_access.log combined;
        error_log /var/log/nginx/suspicious_errors.log warn;
        
        # Rate limit for file access attempts
        limit_req zone=general_rate burst=10 nodelay;
        
        proxy_pass http://backend;
    }
    
    # Security logging for admin endpoints
    location /admin/ {
        access_log /var/log/nginx/admin_access.log combined;
        error_log /var/log/nginx/admin_errors.log error;
        
        # Enhanced rate limiting for admin access
        limit_req zone=strict_zone burst=5 delay=2;
        limit_req_status 403;
        
        proxy_pass http://admin_backend;
    }
}
```

### 5. Advanced Security Header Implementation

```nginx
# Comprehensive security header configuration with logging
map $http_x_forwarded_proto $secure_scheme {
    default $http_x_forwarded_proto;
    "" "http";
}

map $http_x_forwarded_for $forwarded_for {
    default "";
    ~*"(?<=, )\d+\.\d+\.\d+\.\d+" $1;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # Security headers with logging capability
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy logging
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
    
    # Security logging for header changes
    access_log /var/log/nginx/security_headers.log combined;
    
    # Advanced rate limiting with custom headers
    location / {
        # Log request headers for security analysis
        access_log /var/log/nginx/header_analysis.log combined;
        
        # Rate limiting with custom error responses
        limit_req zone=general_rate burst=20 nodelay;
        limit_req_status 429;
        
        proxy_pass http://backend;
    }
}
```

### 6. Comprehensive Security Logging Configuration

```nginx
# Complete security logging configuration with all advanced features
http {
    # Security logging zones
    limit_req_zone $binary_remote_addr zone=security_zone:10m rate=5r/s;
    
    # Extended logging formats
    log_format security_audit '$time_local [$msec] '
                             'client_ip="$remote_addr" '
                             'request_method="$request_method" '
                             'request_uri="$uri" '
                             'query_string="$query_string" '
                             'status_code=$status '
                             'response_size=$body_bytes_sent '
                             'user_agent="$http_user_agent" '
                             'referer="$http_referer" '
                             'forwarded_for="$http_x_forwarded_for" '
                             'real_ip="$http_x_real_ip" '
                             'request_time=$request_time '
                             'upstream_response_time=$upstream_response_time '
                             'ssl_cipher="$ssl_cipher" '
                             'ssl_protocol="$ssl_protocol" '
                             'geoip_country="$geoip_country_code" '
                             'geoip_region="$geoip_region_name" '
                             'geoip_city="$geoip_city_name" '
                             'security_event="$http_x_security_event" '
                             'blocked_reason="$http_x_blocked_reason"';
    
    # Security event logging
    log_format security_events '$time_local [$msec] '
                              'ip="$remote_addr" '
                              'method="$request_method" '
                              'uri="$uri" '
                              'status=$status '
                              'size=$body_bytes_sent '
                              'ua="$http_user_agent" '
                              'ref="$http_referer" '
                              'blocked="$limit_req_status" '
                              'excess="$limit_req_excess" '
                              'zone="$limit_req_zone"';
    
    # Security error logging with detailed context
    error_log /var/log/nginx/security_errors.log warn;
    
    # Security audit logging with full context
    access_log /var/log/nginx/security_audit.log security_audit;
    
    # Security events logging with filtering
    access_log /var/log/nginx/security_events.log security_events;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # Comprehensive security logging setup
    access_log /var/log/nginx/security_access.log combined;
    
    # Rate limiting with enhanced logging
    location /api/ {
        limit_req zone=security_zone burst=20 nodelay;
        limit_req_log_level info;
        limit_req_status 429;
        
        # Additional security logging
        access_log /var/log/nginx/api_security.log security_audit;
        error_log /var/log/nginx/api_errors.log warn;
        
        proxy_pass http://backend_api;
    }
    
    # Enhanced logging for sensitive endpoints
    location /admin/ {
        # Security headers and logging
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Enhanced rate limiting
        limit_req zone=security_zone burst=10 delay=5;
        limit_req_log_level error;
        limit_req_status 403;
        
        # Detailed security logging
        access_log /var/log/nginx/admin_security.log security_events;
        error_log /var/log/nginx/admin_errors.log error;
        
        proxy_pass http://admin_backend;
    }
    
    # Regular security logging
    location / {
        # Basic security logging
        access_log /var/log/nginx/regular_security.log combined;
        error_log /var/log/nginx/regular_errors.log warn;
        
        # Rate limiting with standard settings
        limit_req zone=security_zone burst=30 nodelay;
        
        proxy_pass http://backend;
    }
}
```

---

## Security Logging Configuration

### 1. Log Format Definitions

```nginx
# Enhanced security logging formats for different purposes
log_format security_detailed '$time_local [$msec] '
                           'ip="$remote_addr" '
                           'method="$request_method" '
                           'uri="$uri" '
                           'query="$query_string" '
                           'status=$status '
                           'size=$body_bytes_sent '
                           'ua="$http_user_agent" '
                           'ref="$http_referer" '
                           'forwarded="$http_x_forwarded_for" '
                           'real_ip="$http_x_real_ip" '
                           'geoip_country="$geoip_country_code" '
                           'geoip_region="$geoip_region_name" '
                           'geoip_city="$geoip_city_name" '
                           'request_time=$request_time '
                           'upstream_time=$upstream_response_time '
                           'ssl_cipher="$ssl_cipher" '
                           'ssl_protocol="$ssl_protocol"';

# Security event logging with comprehensive fields
log_format security_events '$time_local [$msec] '
                          'ip="$remote_addr" '
                          'method="$request_method" '
                          'uri="$uri" '
                          'status=$status '
                          'size=$body_bytes_sent '
                          'ua="$http_user_agent" '
                          'ref="$http_referer" '
                          'forwarded="$http_x_forwarded_for" '
                          'real_ip="$http_x_real_ip" '
                          'blocked="$limit_req_status" '
                          'excess="$limit_req_excess" '
                          'zone="$limit_req_zone" '
                          'request_time=$request_time '
                          'upstream_time=$upstream_response_time';
```

### 2. Log File Management

```bash
# Advanced log rotation for security logs
# /etc/logrotate.d/nginx-security-advanced

/var/log/nginx/security_*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

# Security log file permissions and ownership
/var/log/nginx/security_*.log {
    create 0640 root nginx
    create 0640 root nginx
}
```

---

## Rate Limiting Implementation

### 1. Advanced Rate Limiting Zones

```nginx
# Comprehensive rate limiting configuration with multiple zones
http {
    # General purpose rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=20r/s;
    
    # API-specific rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Login endpoint protection
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;
    
    # High-security endpoint protection
    limit_req_zone $binary_remote_addr zone=high_security:10m rate=2r/s;
    
    # Cloudflare and proxy support
    limit_req_zone $http_x_forwarded_for zone=proxy:10m rate=15r/s;
    
    # GeoIP-based rate limiting
    limit_req_zone $geoip_country zone=country:10m rate=5r/s;
    
    # User-agent specific rate limiting
    limit_req_zone $binary_remote_addr:$http_user_agent zone=ua:10m rate=3r/s;
}
```

### 2. Multi-Stage Rate Limiting

```nginx
# Two-stage rate limiting implementation
server {
    # Stage 1: Allow normal traffic with burst
    location /api/public/ {
        limit_req zone=general burst=20 nodelay;
        
        # Log stage 1 events
        access_log /var/log/nginx/api_public.log security_events;
        
        proxy_pass http://public_api;
    }
    
    # Stage 2: Strict limits for sensitive endpoints
    location /api/protected/ {
        limit_req zone=api burst=10 delay=5;
        limit_req zone=high_security burst=5 delay=2;
        
        # Log stage 2 events
        access_log /var/log/nginx/api_protected.log security_events;
        
        proxy_pass http://protected_api;
    }
    
    # Stage 3: Maximum security for admin endpoints
    location /admin/ {
        limit_req zone=high_security burst=5 delay=3;
        limit_req zone=login burst=2 delay=1;
        
        # Log all admin events
        access_log /var/log/nginx/admin_access.log security_events;
        
        proxy_pass http://admin_backend;
    }
}
```

---

## Monitoring and Alerting

### 1. Security Log Analysis Configuration

```bash
# Security log monitoring setup
# /etc/monit/conf.d/nginx_security

check file nginx_security_logs {
    path /var/log/nginx/security_*.log
    every 15 cycles
    if changed timestamp then exec "/usr/local/bin/security_log_alert.sh"
}

check file nginx_error_logs {
    path /var/log/nginx/security_errors.log
    every 15 cycles
    if changed timestamp then exec "/usr/local/bin/security_error_alert.sh"
}
```

### 2. Security Log Parsing and Analysis

```bash
#!/bin/bash
# Security log analysis script for monitoring and alerting

LOG_DIR="/var/log/nginx"
ALERT_THRESHOLD=100
ALERT_EMAIL="security@company.com"

# Analyze rate limiting events
analyze_rate_limits() {
    # Count rate limit exceeded events in last hour
    COUNT=$(grep -c "429" $LOG_DIR/security_access.log | wc -l)
    
    if [ $COUNT -gt $ALERT_THRESHOLD ]; then
        echo "High rate limit events detected: $COUNT in last hour" | \
            mail -s "Security Alert: Rate Limit Exceeded" $ALERT_EMAIL
    fi
}

# Analyze security header violations
analyze_security_headers() {
    # Check for missing security headers in recent logs
    COUNT=$(grep -c "X-Content-Type-Options" $LOG_DIR/security_access.log | wc -l)
    
    if [ $COUNT -lt 90 ]; then
        echo "Security header violations detected" | \
            mail -s "Security Alert: Header Violations" $ALERT_EMAIL
    fi
}

# Run analysis
analyze_rate_limits
analyze_security_headers
```

This comprehensive security logging and rate limiting configuration provides:

1. **Advanced Rate Limiting**: Multi-zone, multi-stage rate limiting with proper error handling
2. **Comprehensive Logging**: Detailed security logs with context and filtering capabilities
3. **Security Headers**: Complete implementation of security headers with logging
4. **GeoIP Integration**: Geographic-based rate limiting and monitoring
5. **User-Agent Differentiation**: Specific rate limiting based on client capabilities
6. **Monitoring and Alerting**: Integration with monitoring systems and alerting mechanisms
7. **Log Rotation and Management**: Proper file management and rotation for security logs

The configuration ensures robust security monitoring while maintaining performance and providing detailed audit trails for security analysis.