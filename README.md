# Thrive — Directus CMS (Back-End)

The headless CMS that serves all content to the Astro front-end
([`E:\Astro-headless`](../Astro-headless/README.md)). Directus runs on
**PostgreSQL** and is read by the front-end over REST using a static token.

```
┌──────────────────┐      ┌──────────────┐
│  Directus CMS    │ ──▶ │ PostgreSQL   │
│  :8055  /admin   │      │ directus_cms │
└──────────────────┘      └──────────────┘
        ▲ REST + static token
┌──────────────────┐
│  Astro front-end │
└──────────────────┘
```

> This Directus instance is **npm-installed** (not Docker). It was migrated from
> XAMPP MariaDB to PostgreSQL — Postgres is now the only supported local DB.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | 20+ (24 used in dev) |
| **PostgreSQL** | 16 / 17 |
| **npm** | bundled with Node |

## 2. First-time setup

### 2.1 Create the database

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres -p 5432 -E UTF8 directus_cms
```

### 2.2 Configure `.env`

Create `E:\directus-cms\.env`:

```ini
# --- Server ---
HOST=0.0.0.0
PORT=8055
PUBLIC_URL=http://localhost:8055
KEY=<random-uuid>          # fixed value — changing it invalidates sessions
SECRET=<random-uuid>       # fixed value
TELEMETRY=false
LOG_LEVEL=info

# --- Database (local PostgreSQL) ---
DB_CLIENT=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=directus_cms
DB_USER=postgres
DB_PASSWORD=<your-postgres-password>

# --- First admin (created on bootstrap) ---
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<your-admin-password>
```

### 2.3 Install, bootstrap, run

```powershell
cd E:\directus-cms
npm install
npm run bootstrap     # creates Directus system tables + the admin user
npm run start         # → http://localhost:8055/admin
```

Log in at <http://localhost:8055/admin> with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `.env`.

### 2.4 Seed the content collections

Each `setup-*.mjs` creates a collection's fields and seeds its content **via the
Directus REST API** (Directus must be running). Run the ones you need:

```powershell
node setup-homepage-full.mjs     # homepage singleton + content
node setup-header.mjs            # site header
node setup-subnav.mjs            # nav_items
node setup-megamenu.mjs          # SERVICES mega-menu (+ -about / -learn / -local variants)
node setup-services-promo.mjs    # SERVICES promo panel
node setup-results.mjs           # result cards
node setup-search.mjs            # search page labels
node setup-dms.mjs               # Digital Marketing Services page
node setup-dms-strategy.mjs      # Strategy Development page
node setup-about.mjs             # About page (base + Optimize/Generate/Grow + nav)
node setup-enterprise.mjs        # Enterprise Digital Marketing page
```

Every setup script also sets a **static admin token** on the admin user and
writes it to `static-token.txt`. Copy that value into the front-end `.env` as
`DIRECTUS_STATIC_TOKEN` so the front-end can read content.

> **Target a remote Directus** (instead of local) by setting env vars first:
> ```powershell
> $env:DIRECTUS_URL="https://thrive-directus-backend.onrender.com"
> $env:ADMIN_PASSWORD="<remote admin password>"
> node setup-enterprise.mjs
> ```
> The scripts are idempotent and retry the free-tier "under pressure" limiter.

---

## 3. Run commands

| Command | What it does |
|---------|--------------|
| `npm run bootstrap` | Create/migrate Directus system tables + first admin |
| `npm run start` | Start Directus → <http://localhost:8055> |
| `node setup-*.mjs` | Create + seed a content collection (Directus must be running) |

---

## 4. Content collections

**Singletons:** `homepage`, `search_page`, `header`, `services_promo`, `dms`,
`dms_strategy`, `about`, `enterprise`.

**Repeatable:** `nav_items`, `mega_menu`, `result_cards`, `home_results`,
`home_wins`, `home_aiv`, `home_tools`, `home_values`, `testimonials`,
`dms_cases`, `dms_testimonials`, `dms_tools`, `dms_services`, `dms_reasons`,
`dms_faqs`, `strategy_faqs`, `strategy_reasons`, `leads`.

---

## 5. Scripts reference

### Content setup / seed
`setup.mjs` (original base) · `setup-homepage*.mjs` · `setup-header*.mjs` ·
`setup-subnav.mjs` · `setup-megamenu*.mjs` · `setup-services-promo.mjs` ·
`setup-results.mjs` · `setup-local-results.mjs` · `setup-search.mjs` ·
`setup-dms.mjs` · `setup-dms-strategy.mjs` · `setup-about.mjs` ·
`setup-about-og.mjs` · `setup-enterprise.mjs`

### Migration / maintenance utilities
| Script | Purpose |
|--------|---------|
| `export-data.mjs` | Export all collection content → `data-export.json` |
| `import-data.mjs` | Import `data-export.json` + set the static token (env-var aware) |
| `apply-schema-remote.mjs` | Push `snapshot.yaml` schema to a remote Directus over HTTP |
| `fix-snapshot.cjs` | One-off: strip the PostGIS `geometry` field from `snapshot.yaml` |
| `cleanup-about-contact.mjs` | Delete given collections + dead nav rows |

### Artifacts
`snapshot.yaml` (schema snapshot) · `data-export.json` (content export) ·
`enterprise-seed-raw.json` (enterprise seed source) · `static-token.txt`
(the static admin token).

---

## 6. Backup / migrate content

```powershell
# Capture current schema (DB-agnostic)
.\node_modules\.bin\directus.cmd schema snapshot --yes .\snapshot.yaml
# Export content
node export-data.mjs
# Apply schema to a fresh/remote instance, then import content
.\node_modules\.bin\directus.cmd schema apply --yes .\snapshot.yaml   # local target
node apply-schema-remote.mjs                                          # remote target (HTTP)
node import-data.mjs                                                  # content + token
```

---

## 7. Deployment (Render)

- **Database:** managed PostgreSQL (Render or **Neon** — Neon's free tier is
  persistent; Render's free Postgres is deleted after 30 days).
- **Directus:** a Render **Web Service** from the official `directus/directus`
  Docker image. Key env vars:
  ```ini
  DB_CLIENT=pg
  DB_CONNECTION_STRING=<internal postgres connection string>
  KEY=<fixed-uuid>
  SECRET=<fixed-uuid>
  PUBLIC_URL=https://<your-directus>.onrender.com
  ADMIN_EMAIL=...
  ADMIN_PASSWORD=...
  ```
  Use the **internal** connection string when DB + Directus are both on Render.
  Remove individual `DB_HOST`/`DB_PORT`/etc. when using `DB_CONNECTION_STRING`.
- **Seed the remote** by pointing the `setup-*.mjs` scripts at it (see §2.4),
  once the service is up.

---

## 8. Notes / gotchas

- `.env`, `static-token.txt`, and `node_modules` should not be committed.
- Keep `KEY`/`SECRET` **fixed** — regenerating them logs everyone out.
- The static token lives on the Directus admin user; keep it in sync with the
  front-end's `DIRECTUS_STATIC_TOKEN`.
- On the free Render tier, Directus sheds load under memory pressure
  (HTTP 503 "Under pressure") — the setup scripts retry automatically; re-run if
  a bulk operation still fails.
- Content is fail-safe on the front-end: if Directus is down, the site renders
  built-in defaults instead of CMS content.
