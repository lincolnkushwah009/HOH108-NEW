# HOH Group - Microservices Solution Architecture

## 1. Architecture Overview

```
                        +--------------------------------------------------+
                        |            CLIENT APPLICATIONS (SPA/Mobile)       |
                        |  HOH108ERP  |  GIK  |  HOHMatch  |  DesignHub    |
                        +--------------------------------------------------+
                                            |
                                       HTTPS/WSS
                                            |
                        +--------------------------------------------------+
                        |              NGINX (Reverse Proxy)                |
                        |         SSL Termination + Rate Limiting           |
                        +--------------------------------------------------+
                                            |
                        +--------------------------------------------------+
                        |         KONG API GATEWAY (Open Source)             |
                        |  - Route management    - Rate limiting            |
                        |  - Auth plugin (JWT)   - Request transformation   |
                        |  - Logging & analytics - Circuit breaker          |
                        +--------------------------------------------------+
                                            |
                  +-------------------------+-------------------------+
                  |                         |                         |
          +-------v--------+       +-------v--------+       +-------v--------+
          |  NGINX Load    |       |  NGINX Load    |       |  NGINX Load    |
          |  Balancer      |       |  Balancer      |       |  Balancer      |
          |  (Upstream)    |       |  (Upstream)    |       |  (Upstream)    |
          +-------+--------+       +-------+--------+       +-------+--------+
                  |                         |                         |
     +------------+------------+   +-------+-------+    +------------+------------+
     |            |            |   |               |    |            |            |
+----v----+ +----v----+ +----v----+ +----v----+ +----v----+ +----v----+ +----v----+
|HOH108ERP| |HOH108ERP| | GIK    | | GIK    | |HOHMatch | |DesignHub| |DesignHub|
|Service  | |Service  | |Service | |Service | |Service  | |Service  | |Service  |
|Node 1   | |Node 2   | |Node 1  | |Node 2  | |Node 1   | |Node 1   | |Node 2   |
+---------+ +---------+ +--------+ +--------+ +---------+ +---------+ +---------+
     |            |           |          |          |           |            |
     +------------+-----------+----------+----------+-----------+------------+
                                         |
                        +----------------v-----------------+
                        |     APACHE KAFKA CLUSTER          |
                        |  - Event streaming                |
                        |  - Async messaging (MQ)           |
                        |  - Service-to-service comms       |
                        |  - Audit log streaming             |
                        +----------------+-----------------+
                                         |
                        +----------------v-----------------+
                        |       DATABASE LAYER              |
                        |  (See Section 5 for details)      |
                        +----------------------------------+
                                         |
         +-------------+----------+------------+-------------+
         |             |          |            |             |
    +----v----+  +----v----+ +---v-----+ +---v--------+  +----v----+
    |HOH108ERP|  | GIK DB  | |HOHMatch | |HOH108      |  | Master  |
    |   DB    |  |         | |  DB     | |DesignHub DB |  |   DB    |
    +---------+  +---------+ +---------+ +------------+  +---------+

                                    +----------------------------------+
                                    |     CI/CD PIPELINE                |
                                    |  GitHub Actions + ArgoCD         |
                                    |  GitHub Repository               |
                                    +----------------------------------+
```

---

## 2. Open Source Tool Recommendations

### 2.1 API Gateway - **Kong (Open Source)**
| Aspect | Details |
|--------|---------|
| **Tool** | Kong Gateway OSS |
| **Why** | Nginx-based, battle-tested, plugin ecosystem, no vendor lock-in |
| **Key Plugins** | JWT Auth, Rate Limiting, CORS, Request Transformer, Prometheus, TCP Log |
| **Admin** | Kong Admin API + **Konga** (open source dashboard) |
| **Deployment** | Docker container, PostgreSQL for config store |

**Alternative considered:** Traefik, APISIX — Kong chosen for maturity and plugin richness.

### 2.2 Load Balancer - **NGINX (Open Source)**
| Aspect | Details |
|--------|---------|
| **Tool** | NGINX OSS |
| **Why** | Already in use (hoh108.com), proven performance, native upstream load balancing |
| **Strategy** | Round-robin with health checks per service cluster |
| **SSL** | Let's Encrypt via Certbot auto-renewal |
| **Role** | L7 reverse proxy + SSL termination + static file serving |

### 2.3 Message Queue - **Apache Kafka**
| Aspect | Details |
|--------|---------|
| **Tool** | Apache Kafka + KRaft (no ZooKeeper) |
| **Why** | Matches your diagram; handles both event streaming AND message queuing |
| **UI** | **Kafka UI** (open source web dashboard) |
| **Use Cases** | Inter-service events, async processing, audit logs, notification dispatch |

**Topics Architecture:**
```
hoh.events.crm.*          # HOH108ERP events (leads, quotations, invoices)
hoh.events.gik.*          # GIK platform events
hoh.events.match.*        # HOHMatch material matching events
hoh.events.designhub.*    # DesignHub collaboration events
hoh.events.auth.*         # Auth events (login, logout, role changes)
hoh.events.notifications  # Cross-service notification bus
hoh.events.audit          # Centralized audit trail
hoh.dlq.*                 # Dead letter queues per service
```

### 2.4 CI/CD & Release Management - **GitHub Actions + ArgoCD**
| Aspect | Details |
|--------|---------|
| **Source Control** | GitHub (as shown in diagram) |
| **CI** | GitHub Actions — build, test, lint, security scan per service |
| **CD** | ArgoCD (GitOps) for deployment to server |
| **Container Registry** | GitHub Container Registry (GHCR) — free for public, included in plans |
| **Release Strategy** | Semantic versioning, tagged releases, environment promotion (dev → staging → prod) |

**Pipeline Flow:**
```
Developer Push → GitHub Actions CI
    ├── Lint + Unit Tests
    ├── Build Docker Image
    ├── Security Scan (Trivy)
    ├── Push to GHCR
    └── Update deployment manifest
            ↓
ArgoCD detects manifest change
    ├── Pull new image
    ├── Rolling deployment
    ├── Health check
    └── Rollback on failure
```

---

## 3. Monitoring & Observability (Open Source Stack)

```
+-------------------+    +-------------------+    +-------------------+
|   Prometheus      |    |   Grafana         |    |   Loki            |
|   (Metrics)       |--->|   (Dashboards)    |<---|   (Log Aggregation)|
+-------------------+    +-------------------+    +-------------------+
         ^                                                  ^
         |                                                  |
    Node Exporter                                     Promtail Agent
    Kong Metrics                                    (collects logs from
    Custom Metrics                                   all services)
```

| Tool | Purpose |
|------|---------|
| **Prometheus** | Metrics collection (API latency, error rates, DB connections) |
| **Grafana** | Visualization dashboards |
| **Loki + Promtail** | Centralized log aggregation (replaces ELK, lighter weight) |
| **Jaeger** | Distributed tracing across microservices |

---

## 4. Service Discovery & Containerization

| Tool | Purpose |
|------|---------|
| **Docker** | Containerize each microservice |
| **Docker Compose** | Local development orchestration |
| **Consul** (HashiCorp) | Service discovery + health checking + KV config |
| **Portainer** | Docker management UI (open source) |

---

## 5. Database Architecture - Master/Child Pattern

### 5.1 Recommended DB: **MongoDB (Master) + PostgreSQL (DesignHub)**

Since the existing HOH108 backend already uses MongoDB, we maintain consistency while introducing PostgreSQL for DesignHub (which uses Prisma/Next.js).

```
                    +================================+
                    ||      MASTER DATABASE          ||
                    ||      MongoDB (ReplicaSet)     ||
                    ||                               ||
                    ||  Collections:                  ||
                    ||  - companies                   ||
                    ||  - users (global identity)     ||
                    ||  - roles & permissions         ||
                    ||  - subscriptions & billing     ||
                    ||  - audit_logs                  ||
                    ||  - global_config               ||
                    ||  - tenant_registry             ||
                    +================================+
                          |       |       |       |
              +-----------+---+---+---+---+---+---+-----------+
              |               |           |                   |
    +---------v---------+  +--v--------+  +--v-----------+  +-v--------------+
    |   HOH108ERP DB    |  |  GIK DB   |  | HOHMatch DB  |  | DesignHub DB   |
    |   (MongoDB)       |  | (MongoDB) |  | (MongoDB)    |  | (PostgreSQL)   |
    |                   |  |           |  |              |  |                |
    | - leads           |  | - games   |  | - materials  |  | - projects     |
    | - clients         |  | - players |  | - matches    |  | - designs      |
    | - quotations      |  | - scores  |  | - vendors    |  | - components   |
    | - invoices        |  | - events  |  | - ai_results |  | - templates    |
    | - projects        |  | - assets  |  | - catalogs   |  | - revisions    |
    | - employees       |  | - teams   |  | - images     |  | - comments     |
    | - call_logs       |  | - rewards |  | - ratings    |  | - files        |
    | - attendance      |  |           |  |              |  |                |
    | - company_settings|  |           |  |              |  |                |
    +-------------------+  +-----------+  +--------------+  +----------------+
```

### 5.2 Master-Child Sync Strategy

```
+------------------+     +-----------------+     +------------------+
|  Child Service   |     |  Kafka Topic    |     |  Master DB       |
|  (e.g. HOH108)   |---->| hoh.events.sync |---->|  Sync Consumer   |
|  writes locally  |     |                 |     |  updates master  |
+------------------+     +-----------------+     +------------------+
```

**Rules:**
| Rule | Description |
|------|-------------|
| **User Identity** | Master DB is the single source of truth for users/auth |
| **Local Data** | Each child DB owns its domain data (leads, games, materials, designs) |
| **Cross-service queries** | Go through API calls, never direct DB access |
| **Sync mechanism** | Kafka events for eventual consistency |
| **Shared reference data** | Companies, roles, permissions replicated from Master → Child via change events |

### 5.3 MongoDB Replica Set Configuration

```
+-------------------+     +-------------------+     +-------------------+
|   Primary Node    |<--->|   Secondary Node  |<--->|   Secondary Node  |
|   (Read/Write)    |     |   (Read Replica)  |     |   (Read Replica)  |
|   Port: 27017     |     |   Port: 27018     |     |   Port: 27019     |
+-------------------+     +-------------------+     +-------------------+
```

- **Write concern:** `majority` for critical data (users, transactions)
- **Read preference:** `secondaryPreferred` for reports/dashboards
- **Backup:** Daily `mongodump` to S3-compatible storage (MinIO for self-hosted)

---

## 6. User Access Management (UAM) Architecture

### 6.1 Identity Architecture

```
+-----------------------------------------------------------------------+
|                      KEYCLOAK (Open Source IAM)                        |
|                                                                        |
|  +------------------+  +------------------+  +---------------------+  |
|  |  Realm:          |  |  Identity        |  |  Authorization      |  |
|  |  HOH-Group       |  |  Providers:      |  |  Services:          |  |
|  |                  |  |  - Local DB      |  |  - RBAC             |  |
|  |  Clients:        |  |  - Google SSO    |  |  - Fine-grained     |  |
|  |  - hoh108erp     |  |  - Microsoft SSO |  |    permissions      |  |
|  |  - gik           |  |                  |  |  - API scopes       |  |
|  |  - hohmatch      |  |                  |  |                     |  |
|  |  - designhub     |  |                  |  |                     |  |
|  +------------------+  +------------------+  +---------------------+  |
+-----------------------------------------------------------------------+
                                |
                          JWT Tokens
                                |
                    +-----------v-----------+
                    |    Kong API Gateway    |
                    |    (JWT Validation)    |
                    +-----------------------+
```

### 6.2 RBAC Model (Role-Based Access Control)

```
SUPER_ADMIN (HOH Group Level)
  └── Can access ALL applications, ALL companies

COMPANY_ADMIN (Per Company: Interior Plus, etc.)
  └── Full access within their company scope

APP_ADMIN (Per Application)
  ├── HOH108ERP_ADMIN → Manages CRM/ERP settings
  ├── GIK_ADMIN → Manages game platform
  ├── HOHMATCH_ADMIN → Manages material matching
  └── DESIGNHUB_ADMIN → Manages design projects

MANAGER (Department Level)
  └── Views team data, approves within department

USER (Standard)
  └── CRUD on own records, read on permitted resources

VIEWER (Read Only)
  └── Dashboard and report access only
```

### 6.3 Permission Matrix

```javascript
// Permission format: "{app}:{resource}:{action}"
const permissions = {
  // HOH108 ERP
  "erp:leads:create",
  "erp:leads:read",
  "erp:leads:update",
  "erp:leads:delete",
  "erp:quotations:create",
  "erp:quotations:approve",
  "erp:invoices:create",
  "erp:reports:view",

  // GIK
  "gik:games:manage",
  "gik:players:view",

  // HOHMatch
  "match:materials:upload",
  "match:matches:run",
  "match:vendors:manage",

  // DesignHub
  "designhub:projects:create",
  "designhub:designs:collaborate",
  "designhub:templates:manage",
};
```

### 6.4 JWT Token Structure

```json
{
  "sub": "user_id_123",
  "iss": "keycloak.hoh108.com",
  "aud": ["hoh108erp", "gik", "hohmatch", "designhub"],
  "realm_access": {
    "roles": ["COMPANY_ADMIN"]
  },
  "resource_access": {
    "hoh108erp": { "roles": ["HOH108ERP_ADMIN"] },
    "designhub": { "roles": ["USER"] }
  },
  "company_id": "6967b34f1496c6c6e553fd1e",
  "permissions": ["erp:*", "designhub:projects:read"],
  "exp": 1711324800
}
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
Layer 1: NETWORK SECURITY
├── Firewall (UFW/iptables) — only ports 80, 443, 22 open
├── DDoS protection (Cloudflare free tier or fail2ban)
├── VPN for admin access to internal services
└── Private network for DB + Kafka (not internet-facing)

Layer 2: TRANSPORT SECURITY
├── TLS 1.3 everywhere (Let's Encrypt)
├── mTLS between microservices (optional, via Consul Connect)
├── HSTS headers enforced
└── Certificate auto-renewal via Certbot

Layer 3: API SECURITY (Kong Gateway)
├── JWT validation on every request
├── Rate limiting (100 req/min per user, 1000 req/min per service)
├── CORS whitelisting (hoh108.com, designhub.hoh108.com, etc.)
├── Request size limits (10MB default, 50MB for file uploads)
├── IP blacklisting
└── Bot detection

Layer 4: APPLICATION SECURITY
├── Input validation (Joi/Zod schemas on every endpoint)
├── SQL/NoSQL injection prevention (parameterized queries)
├── XSS prevention (helmet.js, CSP headers)
├── CSRF tokens for state-changing operations
├── File upload scanning (ClamAV)
└── Dependency vulnerability scanning (npm audit, Snyk)

Layer 5: DATA SECURITY
├── Encryption at rest (MongoDB encrypted storage engine)
├── PII encryption (AES-256 for phone numbers, emails)
├── Database access via service accounts only (no root)
├── Automated backups with encryption
├── Audit logging for all data access
└── Data retention policies per module
```

### 7.2 Secret Management

```
+-----------------------------------+
|  HashiCorp Vault (Open Source)    |
|                                   |
|  Secrets:                         |
|  ├── database/creds/hoh108erp    |
|  ├── database/creds/gik          |
|  ├── database/creds/hohmatch     |
|  ├── database/creds/designhub    |
|  ├── kafka/credentials           |
|  ├── jwt/signing-keys            |
|  ├── api/callyzer-key            |
|  └── smtp/credentials            |
+-----------------------------------+
```

**Alternative (simpler):** Docker Secrets + `.env` files with `sops` encryption for smaller deployments.

---

## 8. Repository Folder Structure (Monorepo)

```
HOH-Group/
├── .github/
│   ├── workflows/
│   │   ├── ci-hoh108erp.yml          # CI for HOH108 ERP service
│   │   ├── ci-gik.yml                # CI for GIK service
│   │   ├── ci-hohmatch.yml           # CI for HOHMatch service
│   │   ├── ci-designhub.yml          # CI for DesignHub service
│   │   ├── ci-gateway.yml            # CI for API Gateway config
│   │   └── deploy-production.yml     # Production deployment
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── packages/                          # Shared libraries
│   ├── common/                        # Shared utilities
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── jwt.utils.js       # JWT creation/validation
│   │   │   │   ├── rbac.middleware.js  # Role-based access control
│   │   │   │   └── permissions.js     # Permission definitions
│   │   │   ├── database/
│   │   │   │   ├── connection.js      # DB connection factory
│   │   │   │   ├── master-sync.js     # Master DB sync utilities
│   │   │   │   └── tenant.resolver.js # Multi-tenant DB routing
│   │   │   ├── kafka/
│   │   │   │   ├── producer.js        # Kafka producer wrapper
│   │   │   │   ├── consumer.js        # Kafka consumer wrapper
│   │   │   │   └── topics.js          # Topic name constants
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.js   # Global error handling
│   │   │   │   ├── request-logger.js  # Request/response logging
│   │   │   │   ├── rate-limiter.js    # Rate limiting
│   │   │   │   └── validator.js       # Input validation wrapper
│   │   │   ├── utils/
│   │   │   │   ├── encryption.js      # AES encryption utilities
│   │   │   │   ├── pagination.js      # Standard pagination
│   │   │   │   ├── response.js        # Unified API response format
│   │   │   │   └── date.utils.js      # Date formatting
│   │   │   └── index.js              # Package exports
│   │   ├── package.json
│   │   └── tests/
│   │
│   └── ui-kit/                        # Shared frontend components
│       ├── src/
│       │   ├── components/            # Shared React components
│       │   ├── hooks/                 # Shared hooks
│       │   ├── styles/                # Brand tokens (#C59C82, etc.)
│       │   └── index.js
│       └── package.json
│
├── services/                          # Microservices (backend)
│   ├── hoh108-erp/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── lead.controller.js
│   │   │   │   ├── client.controller.js
│   │   │   │   ├── quotation.controller.js
│   │   │   │   ├── invoice.controller.js
│   │   │   │   ├── project.controller.js
│   │   │   │   ├── employee.controller.js
│   │   │   │   ├── attendance.controller.js
│   │   │   │   └── report.controller.js
│   │   │   ├── models/
│   │   │   │   ├── lead.model.js
│   │   │   │   ├── client.model.js
│   │   │   │   ├── quotation.model.js
│   │   │   │   ├── invoice.model.js
│   │   │   │   └── ...
│   │   │   ├── routes/
│   │   │   │   ├── index.js           # Route aggregator
│   │   │   │   ├── lead.routes.js
│   │   │   │   ├── client.routes.js
│   │   │   │   └── ...
│   │   │   ├── services/              # Business logic layer
│   │   │   │   ├── lead.service.js
│   │   │   │   ├── quotation.service.js
│   │   │   │   ├── callyzer.service.js
│   │   │   │   └── ...
│   │   │   ├── events/                # Kafka event handlers
│   │   │   │   ├── producers/
│   │   │   │   │   └── lead.producer.js
│   │   │   │   └── consumers/
│   │   │   │       └── user-sync.consumer.js
│   │   │   ├── validators/            # Request validation schemas
│   │   │   │   ├── lead.validator.js
│   │   │   │   └── ...
│   │   │   ├── config/
│   │   │   │   └── index.js
│   │   │   └── server.js
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── gik/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── events/
│   │   │   ├── validators/
│   │   │   └── server.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── hohmatch/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── material.controller.js
│   │   │   │   ├── match.controller.js
│   │   │   │   └── vendor.controller.js
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── ai-matching.service.js
│   │   │   │   └── image-processing.service.js
│   │   │   ├── events/
│   │   │   ├── validators/
│   │   │   └── server.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── designhub/
│   │   ├── src/                       # Next.js + Prisma (PostgreSQL)
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── ...
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── auth-service/                  # Centralized auth microservice
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── user.controller.js
│   │   │   │   └── role.controller.js
│   │   │   ├── models/
│   │   │   │   ├── user.model.js
│   │   │   │   ├── role.model.js
│   │   │   │   └── permission.model.js
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── token.service.js
│   │   │   │   └── keycloak.service.js
│   │   │   ├── events/
│   │   │   └── server.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── notification-service/          # Centralized notifications
│       ├── src/
│       │   ├── channels/
│       │   │   ├── email.channel.js
│       │   │   ├── sms.channel.js
│       │   │   ├── push.channel.js
│       │   │   └── whatsapp.channel.js
│       │   ├── templates/
│       │   ├── events/
│       │   │   └── consumers/
│       │   │       └── notification.consumer.js
│       │   └── server.js
│       ├── Dockerfile
│       └── package.json
│
├── apps/                              # Frontend applications
│   ├── hoh108-erp/                    # Vite + React (existing)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/             # API client calls
│   │   │   ├── store/                # State management
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── gik/                           # GIK frontend
│   ├── hohmatch/                      # HOHMatch frontend
│   ├── designhub/                     # DesignHub (Next.js, existing)
│   └── admin-portal/                  # Super admin dashboard
│       ├── src/
│       │   ├── pages/
│       │   │   ├── dashboard/
│       │   │   ├── users/
│       │   │   ├── roles/
│       │   │   ├── companies/
│       │   │   ├── services/
│       │   │   └── monitoring/
│       │   └── ...
│       └── package.json
│
├── infrastructure/                    # DevOps & Infrastructure
│   ├── docker/
│   │   ├── docker-compose.yml         # Full stack local dev
│   │   ├── docker-compose.dev.yml     # Dev overrides
│   │   ├── docker-compose.prod.yml    # Production overrides
│   │   └── Dockerfiles/
│   │       ├── node.Dockerfile        # Base Node.js image
│   │       └── nginx.Dockerfile       # Custom Nginx image
│   │
│   ├── kong/
│   │   ├── kong.yml                   # Declarative Kong config
│   │   ├── plugins/                   # Custom Kong plugins
│   │   └── consumers.yml             # API consumer definitions
│   │
│   ├── kafka/
│   │   ├── docker-compose.kafka.yml   # Kafka cluster setup
│   │   ├── topics.sh                  # Topic creation script
│   │   └── connect/                   # Kafka Connect configs
│   │       └── mongodb-sink.json      # MongoDB CDC connector
│   │
│   ├── nginx/
│   │   ├── nginx.conf                 # Main Nginx config
│   │   ├── conf.d/
│   │   │   ├── hoh108erp.conf         # HOH108 ERP vhost
│   │   │   ├── gik.conf
│   │   │   ├── hohmatch.conf
│   │   │   └── designhub.conf
│   │   └── ssl/
│   │
│   ├── keycloak/
│   │   ├── realm-export.json          # HOH realm config
│   │   └── themes/                    # Custom login theme
│   │
│   ├── monitoring/
│   │   ├── prometheus/
│   │   │   └── prometheus.yml
│   │   ├── grafana/
│   │   │   └── dashboards/
│   │   └── loki/
│   │       └── loki-config.yml
│   │
│   └── scripts/
│       ├── setup-dev.sh               # One-command dev setup
│       ├── backup-databases.sh        # Automated DB backup
│       ├── deploy.sh                  # Manual deployment script
│       └── seed-data.sh               # Seed development data
│
├── docs/
│   ├── architecture/
│   │   ├── SOLUTION_ARCHITECTURE.md   # This document
│   │   ├── DATABASE_DESIGN.md
│   │   ├── API_STANDARDS.md
│   │   └── SECURITY_POLICIES.md
│   ├── api/
│   │   └── openapi/                   # OpenAPI 3.0 specs per service
│   │       ├── hoh108erp.yaml
│   │       ├── gik.yaml
│   │       ├── hohmatch.yaml
│   │       └── auth.yaml
│   └── runbooks/
│       ├── incident-response.md
│       └── deployment-checklist.md
│
├── package.json                       # Root workspace config
├── turbo.json                         # Turborepo build orchestration
├── .gitignore
├── .env.example
└── README.md
```

---

## 9. API Design Standards

### 9.1 Unified API Response Format

```javascript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

### 9.2 API Versioning & URL Structure

```
https://api.hoh108.com/v1/erp/leads              # HOH108 ERP
https://api.hoh108.com/v1/gik/games               # GIK
https://api.hoh108.com/v1/match/materials          # HOHMatch
https://api.hoh108.com/v1/designhub/projects       # DesignHub
https://api.hoh108.com/v1/auth/login               # Auth Service
https://api.hoh108.com/v1/notifications/send       # Notification Service
```

---

## 10. Docker Compose (Development Environment)

```yaml
# infrastructure/docker/docker-compose.yml
version: '3.9'

services:
  # --- API Gateway ---
  kong:
    image: kong:3.6-alpine
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-db
      KONG_PROXY_ACCESS_LOG: /dev/stdout
    ports:
      - "8000:8000"    # Proxy
      - "8001:8001"    # Admin API
    depends_on:
      - kong-db

  kong-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kong
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: kong_secret

  konga:
    image: pantsel/konga
    ports:
      - "1337:1337"    # Kong Admin Dashboard

  # --- Databases ---
  mongo-master:
    image: mongo:7
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27017:27017"
    volumes:
      - mongo-master-data:/data/db

  postgres-designhub:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: designhub
      POSTGRES_USER: designhub_user
      POSTGRES_PASSWORD: designhub_secret
    ports:
      - "5432:5432"

  # --- Message Queue ---
  kafka:
    image: bitnami/kafka:3.7
    environment:
      KAFKA_CFG_NODE_ID: 0
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
    ports:
      - "9092:9092"

  kafka-ui:
    image: provectuslabs/kafka-ui
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: hoh-local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

  # --- Auth ---
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8180:8080"

  # --- Microservices ---
  hoh108-erp:
    build: ../../services/hoh108-erp
    ports:
      - "3001:3001"
    depends_on:
      - mongo-master
      - kafka

  gik-service:
    build: ../../services/gik
    ports:
      - "3002:3002"
    depends_on:
      - mongo-master
      - kafka

  hohmatch-service:
    build: ../../services/hohmatch
    ports:
      - "3003:3003"
    depends_on:
      - mongo-master
      - kafka

  designhub-service:
    build: ../../services/designhub
    ports:
      - "3004:3004"
    depends_on:
      - postgres-designhub
      - kafka

  auth-service:
    build: ../../services/auth-service
    ports:
      - "3005:3005"
    depends_on:
      - mongo-master
      - keycloak
      - kafka

  # --- Monitoring ---
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana-oss
    ports:
      - "3000:3000"

volumes:
  mongo-master-data:
```

---

## 11. Migration Roadmap (Current → Target)

| Phase | What | Duration | Priority |
|-------|------|----------|----------|
| **Phase 1** | Containerize existing HOH108 backend + setup Kong | 2-3 weeks | HIGH |
| **Phase 2** | Set up Master DB + auth-service extraction | 2-3 weeks | HIGH |
| **Phase 3** | Add Kafka for inter-service messaging | 1-2 weeks | HIGH |
| **Phase 4** | Split GIK, HOHMatch, DesignHub into separate services | 3-4 weeks | MEDIUM |
| **Phase 5** | Keycloak SSO integration | 2 weeks | MEDIUM |
| **Phase 6** | CI/CD pipelines (GitHub Actions + ArgoCD) | 1-2 weeks | MEDIUM |
| **Phase 7** | Monitoring stack (Prometheus + Grafana + Loki) | 1 week | LOW |
| **Phase 8** | Vault for secret management | 1 week | LOW |

---

## 12. Technology Summary

| Layer | Tool | License |
|-------|------|---------|
| API Gateway | Kong OSS | Apache 2.0 |
| Load Balancer | NGINX | BSD-2 |
| Message Queue | Apache Kafka | Apache 2.0 |
| CI/CD | GitHub Actions + ArgoCD | Free tier + Apache 2.0 |
| Master DB | MongoDB 7 (ReplicaSet) | SSPL |
| DesignHub DB | PostgreSQL 16 | PostgreSQL License |
| Auth/IAM | Keycloak | Apache 2.0 |
| Secrets | HashiCorp Vault | BUSL (OSS features free) |
| Monitoring | Prometheus + Grafana + Loki | Apache 2.0 |
| Tracing | Jaeger | Apache 2.0 |
| Containers | Docker + Docker Compose | Apache 2.0 |
| Monorepo | Turborepo | MIT |
| Service Discovery | Consul | BUSL (OSS features free) |
