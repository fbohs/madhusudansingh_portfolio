# Nginx Configuration & Best Practices

Welcome to the Nginx documentation section. This collection of guides focuses on setting up a secure, high-performance Nginx environment suitable for production workloads.

## Key Sections

### [Setup](setup.md)
The foundation of a secure web server. This guide covers:
- **Installation:** Deploying Nginx on Ubuntu/Debian and CentOS/RHEL.
- **Security Hardening:** Implementing essential security headers (HSTS, X-Frame-Options).
- **SSL/TLS:** Automating certificate management with Certbot (Let's Encrypt).

### [Rate Limiting](rate-limiting.md)
Protect your applications from abuse and ensure fair resource usage. Learn about:
- **Standard Practices:** Basic request limiting for APIs and login endpoints.
- **Advanced Techniques:** Geo-based blocking, multi-stage limiting, and bot detection.
- **Implementation:** Real-world examples for separate API, Auth, and Public zones.

### [Logging](logging.md)
Turn your logs into powerful security tools. This section details:
- **Security Logging:** Custom log formats to capture critical security context.
- **Monitoring:** Integrating logs with alerting systems.
- **Compliance:** Auditing access patterns and potential threats.
