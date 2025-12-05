---
title: Rate Limiting
description: Setup Nginx Rate Limiting with modern security best practices.
id : rate-limiting
---
# NGINX Rate Limiting Setup - Security Best Practices

## Table of Contents
1. [Standard Practices](#standard-practices)
2. [Advanced Practices](#advanced-practices)
3. [Implementation Examples](#implementation-examples)
4. [Security Considerations](#security-considerations)

---

## Standard Practices

### Basic Rate Limiting Configuration
```nginx
# Define rate limiting zones
limit_req_zone $binary_remote_addr zone=api_rate:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_rate:10m rate=5r/s;

server {
    listen 80;
    
    # API endpoint with rate limiting
    location /api/ {
        limit_req zone=api_rate burst=20 nodelay;
        proxy_pass http://backend;
    }
    
    # Login endpoint with stricter limits
    location /login/ {
        limit_req zone=login_rate burst=5 nodelay;
        proxy_pass http://auth_backend;
    }
}
```

### Key Configuration Parameters
- **rate**: Requests per second (r/s) or minute (r/m)
- **burst**: Maximum burst size before rate limiting applies
- **nodelay**: Process requests immediately without delay (recommended for most cases)
- **zone**: Memory zone name and size (10m = 10MB)

### Standard Rate Limiting Values
```nginx
# Common patterns for different endpoints
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;     # API - 20 req/sec
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;    # Login - 5 req/sec
limit_req_zone $binary_remote_addr zone=signup:10m rate=2r/s;   # Signup - 2 req/sec
limit_req_zone $binary_remote_addr zone=public:10m rate=100r/m; # Public - 100 req/min
```

---

## Advanced Practices

### Two-Stage Rate Limiting
```nginx
# Advanced rate limiting with burst and delay
limit_req_zone $binary_remote_addr zone=advanced_rate:10m rate=5r/s;

server {
    location /api/ {
        limit_req zone=advanced_rate burst=12 delay=8;
        proxy_pass http://backend;
    }
}
```

### IP Allowlisting with Rate Limiting
```nginx
# Geo-based allowlisting
geo $trusted_ip {
    default 0;
    10.0.0.0/8 1;
    172.16.0.0/12 1;
    192.168.0.0/16 1;
    127.0.0.1 1;
}

map $trusted_ip $rate_key {
    1 "";  # Empty string for trusted IPs (no rate limiting)
    0 $binary_remote_addr;  # Client IP for untrusted IPs
}

limit_req_zone $rate_key zone=trusted_rate:10m rate=5r/s;

server {
    location /api/ {
        limit_req zone=trusted_rate burst=10 nodelay;
        proxy_pass http://backend;
    }
}
```

### Multi-Zone Rate Limiting
```nginx
# Different limits for different client types
limit_req_zone $binary_remote_addr zone=regular_user:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=bot_user:10m rate=2r/s;
limit_req_zone $binary_remote_addr zone=api_user:10m rate=50r/s;

# User agent classification
map $http_user_agent $user_type {
    default regular_user;
    ~*bot bot_user;
    ~*api api_user;
}

server {
    location /api/ {
        limit_req zone=$user_type burst=20 nodelay;
        proxy_pass http://backend;
    }
}
```

### Advanced Logging Configuration
```nginx
# Custom logging levels and formats
limit_req_zone $binary_remote_addr zone=secure_rate:10m rate=5r/s;

server {
    location /api/ {
        limit_req zone=secure_rate burst=10 nodelay;
        limit_req_log_level warn;  # Log at warn level instead of error
        proxy_pass http://backend;
    }
}

# Custom log format for rate limiting events
log_format rate_limit '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      'limit_excess:$limit_req_excess';
```

### IP Range-Based Rate Limiting
```nginx
# Define IP ranges for different rate limits
limit_req_zone $binary_remote_addr zone=local_rate:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=global_rate:10m rate=5r/s;

# Custom mapping for IP ranges
map $binary_remote_addr $rate_zone {
    default global_rate;
    ~^0x0A  local_rate;  # 10.x.x.x range
    ~^0x42  local_rate;  # 66.x.x.x range (example)
}

server {
    location /api/ {
        limit_req zone=$rate_zone burst=15 nodelay;
        proxy_pass http://backend;
    }
}
```

### Rate Limiting with Custom Status Codes
```nginx
# Different HTTP status codes for different scenarios
limit_req_zone $binary_remote_addr zone=strict_rate:10m rate=5r/s;

server {
    location /api/ {
        limit_req zone=strict_rate burst=10 nodelay;
        limit_req_status 429;  # Too Many Requests
        proxy_pass http://backend;
    }
    
    location /api/blocked/ {
        limit_req zone=strict_rate burst=5 nodelay;
        limit_req_status 403;  # Forbidden
        proxy_pass http://backend;
    }
}
```

### Rate Limiting with Retry-After Header
```nginx
# Custom response headers for rate-limited requests
limit_req_zone $binary_remote_addr zone=api_rate:10m rate=5r/s;

server {
    location /api/ {
        limit_req zone=api_rate burst=10 nodelay;
        proxy_pass http://backend;
        
        # Custom error handling
        error_page 429 = @rate_limited;
    }
    
    location @rate_limited {
        return 429 "Rate limit exceeded. Please try again later.";
    }
}
```

---

## Implementation Examples

### Complete Production-Ready Configuration
```nginx
# Security-focused rate limiting configuration
http {
    # Secure rate limiting zones with proper memory allocation
    limit_req_zone $binary_remote_addr zone=api_rate:10m rate=50r/s;
    limit_req_zone $binary_remote_addr zone=auth_rate:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=public_rate:10m rate=20r/s;
    
    # Enhanced logging for security monitoring
    limit_req_zone $binary_remote_addr zone=monitor_rate:10m rate=1r/s;
    
    # Custom logging format for rate limiting events
    log_format rate_limit_log '$remote_addr - $remote_user [$time_local] '
                              '"$request" $status $body_bytes_sent '
                              'limit_excess:$limit_req_excess '
                              'zone:$limit_req_zone';
    
    server {
        listen 80;
        server_name example.com;
        
        # API rate limiting with burst handling
        location /api/ {
            limit_req zone=api_rate burst=20 nodelay;
            limit_req_log_level warn;
            
            proxy_pass http://backend;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # Authentication endpoint with strict limits
        location /auth/ {
            limit_req zone=auth_rate burst=5 nodelay;
            proxy_pass http://auth_backend;
        }
        
        # Public endpoints with moderate limits
        location /public/ {
            limit_req zone=public_rate burst=15 nodelay;
            proxy_pass http://public_backend;
        }
        
        # Security monitoring zone
        location /admin/ {
            limit_req zone=monitor_rate burst=5 nodelay;
            proxy_pass http://admin_backend;
        }
        
        # Default error handling for rate limiting
        error_page 429 /rate-limited.html;
        
        location = /rate-limited.html {
            return 429 '<html><body><h1>Rate Limit Exceeded</h1><p>Please try again later.</p></body></html>';
        }
    }
}
```

### Bot Detection and Rate Limiting
```nginx
# Bot detection and intelligent rate limiting
map $http_user_agent $is_bot {
    default 0;
    ~*(bot|crawler|spider) 1;
}

map $is_bot $bot_rate_zone {
    0 "regular_user";
    1 "bot_user";
}

limit_req_zone $binary_remote_addr zone=regular_user:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=bot_user:10m rate=2r/s;

server {
    location /api/ {
        limit_req zone=$bot_rate_zone burst=10 nodelay;
        
        # Additional security headers
        add_header X-RateLimit-Limit $limit_req_limit;
        add_header X-RateLimit-Remaining $limit_req_remaining;
        add_header X-RateLimit-Reset $limit_req_reset;
        
        proxy_pass http://backend;
    }
}
```

### Multi-Tenant Rate Limiting
```nginx
# Tenant-specific rate limiting
limit_req_zone $http_x_tenant_id zone=tenant_rate:10m rate=50r/s;
limit_req_zone $binary_remote_addr zone=global_rate:10m rate=5r/s;

server {
    location /api/ {
        # Tenant-specific limits
        limit_req zone=tenant_rate burst=20 nodelay;
        
        # Global fallback limits
        limit_req zone=global_rate burst=10 nodelay;
        
        proxy_pass http://backend;
    }
}
```

---

## Security Considerations

### Key Security Best Practices

1. **Use Binary Remote Address**: Always use `$binary_remote_addr` for better memory efficiency and security
2. **Implement Burst Protection**: Prevent bursty traffic from overwhelming the system
3. **Log Rate Limiting Events**: Monitor and audit rate limiting activities for security analysis
4. **Use Appropriate Status Codes**: 429 (Too Many Requests) is the standard for rate limiting
5. **Implement Retry-After Headers**: Help clients understand when they can retry requests

### Security Hardening
```nginx
# Additional security measures for rate limiting
limit_req_zone $binary_remote_addr zone=secure_rate:10m rate=5r/s;

server {
    # Rate limiting with security headers
    location /api/ {
        limit_req zone=secure_rate burst=10 nodelay;
        
        # Security headers
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "DENY";
        add_header X-XSS-Protection "1; mode=block";
        
        # Rate limit monitoring
        add_header X-RateLimit-Limit "5";
        add_header X-RateLimit-Remaining $limit_req_remaining;
        
        proxy_pass http://backend;
    }
}
```

### Monitoring and Alerting
```nginx
# Configuration for monitoring rate limiting events
log_format rate_limit_monitor '$remote_addr [$time_local] '
                             'zone="$limit_req_zone" '
                             'excess="$limit_req_excess" '
                             'status="$status"';

# Configure logging to external monitoring systems
access_log /var/log/nginx/rate_limit.log rate_limit_monitor;

# Alert threshold configuration
limit_req_zone $binary_remote_addr zone=alert_rate:10m rate=2r/s;

server {
    location /api/ {
        limit_req zone=alert_rate burst=5 nodelay;
        
        # Custom error handling for alerts
        error_page 429 /alerts/rate-limit-exceeded.html;
        
        proxy_pass http://backend;
    }
}
```

This comprehensive setup provides robust rate limiting with security considerations appropriate for production environments.