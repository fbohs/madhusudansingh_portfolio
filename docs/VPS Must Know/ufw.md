# UFW & iptables — Interview Prep (Pragmatic Guide)

> A quick-reference cheat sheet built from real-world troubleshooting. Each section answers an interview question or solves a problem you'll actually hit on a server.

---

## 1. The 30-Second Mental Model

| Layer | What it is | You touch it? |
|---|---|---|
| **netfilter** | Kernel-level packet filtering framework | Never directly |
| **iptables** | CLI to write netfilter rules | Only for advanced/custom rules |
| **ufw** | Friendly wrapper around iptables | **Default tool on Ubuntu** |
| **firewalld** | Zone-based wrapper (RHEL/CentOS) | Don't mix with ufw |

**Key insight for interviews:** ufw doesn't replace iptables — it *generates* iptables rules under the hood. When you run `sudo iptables -L`, you'll see UFW-managed chains like `ufw-before-input`, `ufw-user-input`, etc.

---

## 2. iptables Core Concepts (Know Cold)

### Tables → Chains → Rules

```
TABLES (purpose)
├── filter   → ALLOW/BLOCK traffic (default table)
├── nat      → Port forwarding, IP masquerading
├── mangle   → Modify packet headers
└── raw      → Skip connection tracking

CHAINS (when rules run)
├── INPUT       → traffic destined for THIS host
├── OUTPUT      → traffic originating FROM this host
├── FORWARD     → traffic ROUTED through this host
├── PREROUTING  → before routing decision (used with nat)
└── POSTROUTING → after routing decision (used with nat)

RULES = match criteria + target (ACCEPT / DROP / REJECT)
```

### The One Diagram to Remember

```
Incoming packet
      │
      ▼
  PREROUTING ──► [routing decision]
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
   (for me?)                     (for someone else?)
     INPUT                          FORWARD
       │                               │
   local process                       │
       │                               │
     OUTPUT                            │
       └───────────────┬───────────────┘
                       ▼
                  POSTROUTING
                       │
                       ▼
                 Outgoing packet
```

### Common iptables Commands

```bash
# View current rules
sudo iptables -L -n -v --line-numbers
sudo iptables -t nat -L -n -v       # NAT table specifically

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Block an IP
sudo iptables -A INPUT -s 192.168.1.100 -j DROP

# Stateful: allow responses to outbound connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Delete rule by line number
sudo iptables -D INPUT 5

# Flush everything (nuclear option)
sudo iptables -F && sudo iptables -X
```

---

## 3. UFW Cheat Sheet (Day-to-Day Commands)

### Lifecycle
```bash
sudo ufw status                  # quick check
sudo ufw status verbose          # with default policies + logging
sudo ufw status numbered         # with rule numbers (for deletion)
sudo ufw enable                  # turn on
sudo ufw disable                 # turn off
sudo ufw reset                   # wipe all rules + reset to defaults
```

### Default Policies (Set These FIRST)
```bash
sudo ufw default deny incoming   # block everything in
sudo ufw default allow outgoing  # allow everything out
sudo ufw default deny routed     # deny forwarding (unless router)
```

### Allow / Deny Patterns

| Goal | Command |
|---|---|
| Allow SSH (named profile) | `sudo ufw allow OpenSSH` |
| Allow port directly | `sudo ufw allow 22/tcp` |
| Allow from specific IP | `sudo ufw allow from 203.0.113.101` |
| Allow IP → specific port | `sudo ufw allow from 203.0.113.101 to any port 22 proto tcp` |
| Allow subnet | `sudo ufw allow from 192.168.0.0/24` |
| Allow on specific interface | `sudo ufw allow in on eth0 from 203.0.113.102` |
| Allow multiple ports | `sudo ufw allow proto tcp from any to any port 80,443` |
| Block IP entirely | `sudo ufw deny from 203.0.113.100` |
| **Block OUTGOING** (important!) | `sudo ufw deny out 25` |
| Delete by rule (verbose) | `sudo ufw delete allow from 203.0.113.101` |
| Delete by number | `sudo ufw delete 2` |

### Application Profiles (Use These When Possible)
```bash
sudo ufw app list                # see what's registered
sudo ufw app info "Nginx Full"   # see what ports a profile covers
sudo ufw allow "Nginx Full"      # opens 80 + 443
```

Common profiles installed by packages: `OpenSSH`, `Nginx Full`, `Nginx HTTP`, `Nginx HTTPS`, `Apache Full`, `Apache`, `Apache Secure`.

### Common Port Reference

| Service | Port | UFW shortcut |
|---|---|---|
| SSH | 22/tcp | `allow ssh` or `allow OpenSSH` |
| HTTP | 80/tcp | `allow http` |
| HTTPS | 443/tcp | `allow https` |
| Rsync (daemon) | 873/tcp | `allow 873` |
| MySQL | 3306/tcp | `allow 3306` |
| PostgreSQL | 5432/tcp | `allow 5432` |
| SMTP | 25/tcp | `deny out 25` (usually outgoing block) |

---

## 4. Real-World Gotchas (Interview Gold)

### Gotcha 1: "Why is rsync working when I never opened port 873?"

**Scenario:** You're rsyncing from your laptop to a VPS that only has ports 22 and 443 open in UFW. Yet `rsync` works perfectly.

**Why:**
- rsync defaults to using **SSH as transport** (port 22) unless you've set up an rsync daemon
- The connection goes through SSH, which IS allowed
- Stateful firewall tracks established connections, so return traffic is allowed automatically

**Verify which transport rsync uses:**
```bash
# On laptop while rsync runs
sudo lsof -i -P -n | grep rsync
# You'll see traffic on :22 (SSH), not :873
```

**Takeaway:** Outgoing default is ALLOW, and SSH-tunneled traffic doesn't need a separate rsync port rule.

### Gotcha 2: Docker silently breaks UFW

**Scenario:** You add UFW rules to block ports, but Docker containers exposing those ports are still reachable.

**Why:** Docker writes its own iptables rules directly, bypassing UFW's chains. It also injects rules into `/etc/ufw/after.rules` like this (which can cause syntax errors):

```
# START DOCKER RULES
*filter                          ← this is the problem
:DOCKER-USER - [0:0]
-A FORWARD -i docker0 -j ACCEPT
# END DOCKER RULES
```

**The error you'll see:**
```
ERROR: problem running ufw-init
Bad argument `*filter'
```

**Fix:**
1. Remove the malformed Docker block from `/etc/ufw/after.rules`
2. Either disable Docker's iptables (`--iptables=false` in `/etc/docker/daemon.json`) and manage manually, **or**
3. Use the `DOCKER-USER` chain for custom rules — Docker reads it before applying its own rules

### Gotcha 3: Stateful Firewalls vs. Stateless Thinking

A common confusion: "I denied incoming on port X, why does outbound work?"

**Because:**
- Outgoing connection = your machine initiates
- Server response comes back on the *same connection*
- Connection tracking (`conntrack`) marks it `ESTABLISHED,RELATED`
- UFW/iptables allow established traffic by default in INPUT chain

Verify:
```bash
sudo iptables -L INPUT -v -n | grep ESTABLISHED
```

### Gotcha 4: Locking Yourself Out

**The classic:** Connect via SSH → run `sudo ufw enable` → instantly lose connection (because default-deny incoming blocks port 22).

**Always:**
```bash
sudo ufw allow OpenSSH    # FIRST
sudo ufw enable           # THEN
```

Same applies to `ufw reset` — it disables UFW AND removes your SSH allow rule.

### Gotcha 5: `deny 25` ≠ `deny out 25`

```bash
sudo ufw deny 25         # blocks INCOMING port 25
sudo ufw deny out 25     # blocks OUTGOING port 25 (e.g., stop spam from your server)
```

The default for `deny` is **incoming**. Always specify `out` for egress rules.

---

## 5. Troubleshooting Playbook (Step-by-Step)

### Scenario: "I configured iptables earlier, now UFW won't enable"

```bash
# 1. Backup what's there
sudo iptables-save > ~/iptables-backup.txt

# 2. Flush all iptables tables
sudo iptables -F && sudo iptables -X
sudo iptables -t nat -F && sudo iptables -t nat -X
sudo iptables -t mangle -F && sudo iptables -t mangle -X

# 3. Reset chain policies
sudo iptables -P INPUT ACCEPT
sudo iptables -P OUTPUT ACCEPT
sudo iptables -P FORWARD ACCEPT

# 4. Also clear IPv6
sudo ip6tables -F && sudo ip6tables -X

# 5. Now reset UFW config
sudo ufw reset
sudo ufw allow OpenSSH
sudo ufw enable
```

### Scenario: "`ufw-init` fails with `Bad argument *filter`"

This means `/etc/ufw/after.rules` or `before.rules` has malformed syntax (usually Docker injection). Fix:

```bash
sudo nano /etc/ufw/after.rules
# Remove any "*filter" line that isn't at the very top of the file
# Remove dangling Docker rule blocks
sudo ufw disable && sudo ufw enable
```

### Scenario: "UFW status shows rules but they don't work"

1. Check actual iptables: `sudo iptables -L -n -v` — are UFW chains there?
2. Check Docker isn't bypassing: `sudo iptables -L DOCKER-USER -n -v`
3. Check order — UFW evaluates rules top-to-bottom; first match wins
4. Check IPv6 separately: `sudo ip6tables -L -n -v`

---

## 6. UFW vs. firewalld (When Asked to Compare)

| Aspect | UFW | firewalld |
|---|---|---|
| Default OS | Ubuntu, Debian | RHEL, CentOS, Fedora |
| Model | Static rule list | Dynamic zone-based |
| Zones | ❌ | ✅ (public, internal, dmz, etc.) |
| Runtime vs permanent | Persistent only | Both, separately |
| Best for | Single-purpose servers | Multi-interface, enterprise |
| Backend | iptables/nftables | iptables/nftables |
| Complexity | Simple | More flexible, steeper curve |

**Never run both at once** — they fight over the same iptables rules.

---

## 7. Best Practices (Show You're Pragmatic)

1. **SSH allow before enable.** Always.
2. **Set defaults before adding rules.** `deny incoming` + `allow outgoing` = secure baseline.
3. **Tighten with source IPs.** `allow from 203.0.113.0/24 to any port 22` beats `allow 22`.
4. **Prefer application profiles** over raw ports — easier to read, less error-prone.
5. **Back up before resetting.** `sudo ufw status numbered > ~/ufw-backup.txt`
6. **Enable logging when debugging.** `sudo ufw logging on` → logs to `/var/log/ufw.log`
7. **Don't mix tools.** Pick UFW *or* firewalld *or* raw iptables.
8. **Make rules survive reboot.** UFW does this automatically; raw iptables needs `iptables-save` + `iptables-restore` (or `iptables-persistent` package).

---

## 8. Likely Interview Questions

### Q: What's the difference between iptables and UFW?
**A:** iptables is the low-level CLI for the Linux kernel's netfilter framework — verbose, powerful, but error-prone. UFW is a high-level wrapper that translates simple commands (`ufw allow 22`) into the iptables rules underneath. UFW is what most Ubuntu admins use day-to-day; iptables is what you reach for when UFW doesn't expose the feature you need.

### Q: What's the difference between DROP and REJECT?
**A:** `DROP` silently discards the packet — the sender sees a timeout. `REJECT` sends back an ICMP "port unreachable" — sender knows immediately it was refused. `DROP` is preferred for security (doesn't leak info about what's filtered).

### Q: Why is port 873 not open but rsync works?
**A:** rsync defaults to using SSH (port 22) as its transport. The rsync daemon (port 873) is only used if you explicitly run `rsyncd`. So as long as SSH is open, rsync-over-SSH works without opening any extra ports.

### Q: How does a stateful firewall handle return traffic?
**A:** Connection tracking (`conntrack` in the kernel) records every outgoing connection. When a reply comes back, it's marked `ESTABLISHED` or `RELATED` and allowed through automatically — even if the INPUT default policy is DROP. That's why you can browse the web with all incoming blocked.

### Q: What happens if I run `ufw enable` over SSH without allowing SSH first?
**A:** You get disconnected. UFW defaults to deny-incoming, and port 22 isn't whitelisted. You'd need console/out-of-band access to recover. Lesson: `sudo ufw allow OpenSSH` *before* `sudo ufw enable`.

### Q: How does Docker interact with UFW?
**A:** Docker writes iptables rules *directly*, bypassing UFW's chain structure. So a UFW rule blocking port 8080 won't stop a Docker container exposing 8080 — the container is still reachable. Solutions: (1) use the `DOCKER-USER` chain for custom rules, (2) disable Docker's iptables manipulation, or (3) bind containers to `127.0.0.1` only.

### Q: How do you persist iptables rules across reboots?
**A:** UFW does it automatically. For raw iptables: `sudo iptables-save > /etc/iptables/rules.v4` and use the `iptables-persistent` package (or a systemd unit) to restore on boot.

### Q: How would you allow SSH only from your office network?
**A:**
```bash
sudo ufw allow from 203.0.113.0/24 to any port 22 proto tcp
sudo ufw delete allow OpenSSH    # remove the open-to-world rule
```

### Q: A user reports they can't reach your web server. How do you debug?
**A:**
1. `sudo ufw status verbose` — is 80/443 allowed?
2. `sudo ss -tuln | grep -E ':80|:443'` — is the service listening?
3. `sudo iptables -L -n -v` — any block rules ahead of allow rules?
4. `sudo tail -f /var/log/ufw.log` — are packets being dropped?
5. Test from the host itself: `curl localhost:80` — rules out app issues
6. Check the cloud provider's security group / network ACL — UFW isn't the only firewall

---

## 9. Quick Mental Checklists

### Before enabling UFW on a remote server
- [ ] `sudo ufw allow OpenSSH` (or your custom SSH port)
- [ ] `sudo ufw default deny incoming`
- [ ] `sudo ufw default allow outgoing`
- [ ] `sudo ufw status` to confirm rules are there
- [ ] `sudo ufw enable`
- [ ] Verify you can open a SECOND SSH session before closing the current one

### When something's broken
- [ ] `sudo ufw status verbose`
- [ ] `sudo iptables -L -n -v` (does the real picture match UFW?)
- [ ] `/var/log/ufw.log` (any blocked packets?)
- [ ] Check `/etc/ufw/after.rules` and `before.rules` for manual edits
- [ ] Check if Docker / k8s / fail2ban is also touching iptables

---

## 10. One-Liner Glossary

- **netfilter** — Kernel firewall framework (the actual code that filters packets)
- **iptables** — Userspace CLI to write netfilter rules
- **nftables** — Modern replacement for iptables (same underlying netfilter)
- **UFW** — Ubuntu's friendly wrapper over iptables
- **firewalld** — Red Hat's zone-based wrapper over iptables/nftables
- **Stateful firewall** — Tracks connections; allows return traffic automatically
- **conntrack** — Kernel's connection-tracking module
- **Chain** — Ordered list of rules (INPUT, OUTPUT, FORWARD, etc.)
- **Target** — What to do with a matching packet (ACCEPT, DROP, REJECT, jump-to-chain)
- **DOCKER-USER** — A chain Docker reads first; safe place to add custom rules without Docker overriding them

---

*Last updated for interview prep — covers iptables fundamentals, UFW daily operations, real troubleshooting (Docker conflicts, rsync confusion, lockout recovery), and common pitfalls.*