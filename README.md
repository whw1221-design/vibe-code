# CRUD Studio

A full-stack CRUD application for **Products**, **Users**, and **Orders**.

- **Frontend:** React 19, Vite, Material UI, React Router
- **Backend:** Node.js, Express
- **Database:** Supabase Postgres (via the `pg` connection pool)
- **UI + API:** can be served together from one Express process

Data flow:

```text
React UI  ->  Express /api  ->  pg pool  ->  Supabase Postgres
```

The Supabase connection string stays on the server. No database credentials
are included in the browser bundle.

---

## 1. Quick start

### Prerequisites

- Node.js 20 or newer
- A Supabase project

### 1.1 Configure the database

In the Supabase Dashboard:

1. Open your project.
2. Go to **Connect** (or **Project Settings -> Database**).
3. Copy the **Session pooler** connection string.
4. Put it in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres
```

If `backend/.env` does not exist:

```powershell
cd C:\crud-test2\backend
Copy-Item .env.example .env
```

Then replace the placeholder `DATABASE_URL`.

> The session pooler is recommended because it supports IPv4 and works well
> with persistent Node.js servers. The direct database host also works on
> networks with IPv6 support.

### 1.2 Install, create tables, and seed

From the project root:

```powershell
cd C:\crud-test2
npm run setup      # install backend + frontend dependencies
npm run db:setup   # create Supabase tables, keys, indexes, and RLS rules
npm run seed       # insert sample users, products, and orders
```

`npm run db:setup` runs `backend/supabase/schema.sql` and is safe to run again.

### 1.3 Build and serve everything with one process

```powershell
npm run serve
```

Open **http://localhost:5000**.

`npm run serve`:

1. Builds React into `frontend/dist` (the build process exits).
2. Starts one Node/Express process that serves:
   - `/` and all React Router pages
   - `/assets/*` (compiled JS/CSS)
   - `/api/*` (Express + Supabase)

If you change frontend code, rerun `npm run serve` (or `npm run build` and
restart the server).

### Option: development with hot reload

Use two terminals:

```powershell
# Terminal 1
cd C:\crud-test2\backend
npm run dev        # API on http://localhost:5000/api

# Terminal 2
cd C:\crud-test2\frontend
npm run dev        # UI on http://localhost:5173
```

Open **http://localhost:5173**. Vite proxies `/api` to port 5000.

### Sample data

`npm run seed` inserts 3 users, 5 products, and 6 orders. All sample users use
the password **`password123`** (passwords are stored hashed; there is no login
screen in this project).

| Name | Email |
| --- | --- |
| Alice Johnson | alice@example.com |
| Bob Smith | bob@example.com |
| Carol Lee | carol@example.com |

Useful database commands:

```bash
npm run db:setup          # apply/refresh the Supabase schema (idempotent)
npm run seed              # seed only when all three tables are empty
npm run seed -- --reset   # clear all rows, reset IDs, re-seed
```

---

## 2. Project structure

```text
crud-test2/
├── package.json                  # root scripts: setup, db:setup, build, start, serve
├── render.yaml                   # Render blueprint: build + start config
├── backend/
│   ├── server.js                 # compatibility entry point for hosts
│   ├── src/
│   │   ├── app.js                # API + built React app + SPA fallback
│   │   ├── server.js             # real HTTP server + graceful shutdown
│   │   ├── config.js             # PORT, DATABASE_URL, FRONTEND_DIST, CORS
│   │   ├── db.js                 # Supabase Postgres pool + query helper
│   │   ├── setup-db.js           # applies supabase/schema.sql
│   │   ├── seed.js               # sample data
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── repositories/
│   │   │   ├── productRepository.js
│   │   │   ├── userRepository.js
│   │   │   └── orderRepository.js
│   │   ├── routes/
│   │   │   ├── products.js
│   │   │   ├── users.js
│   │   │   └── orders.js
│   │   └── utils/
│   │       ├── http.js
│   │       ├── password.js
│   │       └── validation.js
│   ├── supabase/
│   │   └── schema.sql            # tables, FKs, indexes, RLS hardening
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── dist/                     # production build served by Express
│   ├── src/
│   │   ├── api/client.js         # fetch wrapper with error handling
│   │   ├── components/           # layout, dialogs, table helpers
│   │   ├── hooks/useAsyncData.js
│   │   ├── pages/                # Dashboard, Products, Users, Orders, 404
│   │   ├── theme/                # light/dark Material UI theme
│   │   ├── utils/format.js       # currency/date formatting
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## 3. Database design

The schema lives in `backend/supabase/schema.sql`. It creates:

```sql
create table public.users (
  uid integer generated by default as identity primary key,
  uname text not null,
  email text not null unique,
  password text not null
);

create table public.products (
  pid integer generated by default as identity primary key,
  pname text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0 check (price >= 0),
  qty integer not null default 0 check (qty >= 0)
);

create table public.orders (
  oid integer generated by default as identity primary key,
  uid integer not null,
  pid integer not null,
  order_date timestamptz not null default now(),
  constraint orders_uid_fkey foreign key (uid)
    references public.users (uid) on delete cascade on update cascade,
  constraint orders_pid_fkey foreign key (pid)
    references public.products (pid) on delete cascade on update cascade
);
```

Relationships:

- `users 1 ── * orders` through `orders.uid`
- `products 1 ── * orders` through `orders.pid`
- `orders` is the purchase/join record between a user and a product.
- Deleting a user or product cascades to related orders.
- Email is unique and stored lowercase (the API normalizes it).
- `price` uses Postgres `numeric`; the API converts it back to a JS number.
- `order_date` uses `timestamptz`; API responses are ISO-8601 UTC strings.

Security:

- Row Level Security is enabled on all three tables.
- `anon` and `authenticated` are revoked; there are no public RLS policies.
- The Express server connects with the Supabase database connection string,
  which stays server-side. The React app never talks to Supabase directly.

---

## 4. API reference

Base URL: **`http://localhost:5000/api`**

### Response format

Success:

```json
{ "success": true, "data": { "pid": 1, "pname": "Wireless Mouse" } }
```

Error:

```json
{
  "success": false,
  "message": "Product 99 was not found.",
  "errors": { "field": "price" }
}
```

Status codes:

- `200` OK, `201` Created
- `400` validation error / invalid foreign key
- `404` record not found
- `409` duplicate email or unique conflict
- `503` database not configured, unreachable, or schema missing
- `500` unexpected server error

### Products

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/get_products` | List all products |
| GET | `/get_product/:id` | Get one product |
| POST | `/add_product` | Create a product |
| PUT / PATCH | `/update_product/:id` | Update a product (partial allowed) |
| DELETE | `/delete_product/:id` | Delete a product |

```json
POST /api/add_product
{
  "pname": "Wireless Mouse",
  "description": "Ergonomic 2.4 GHz mouse",
  "price": 25.99,
  "qty": 40
}
```

### Users

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/get_users` | List users (password is never returned) |
| GET | `/get_user/:id` | Get one user |
| POST | `/add_user` | Create a user |
| PUT / PATCH | `/update_user/:id` | Update name, email, or password |
| DELETE | `/delete_user/:id` | Delete a user |

```json
POST /api/add_user
{
  "uname": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

On update, omit `password` (or send an empty string) to keep the current
password. Passwords are hashed with Node's built-in `scrypt` using a random
per-password salt before being stored.

### Orders

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/get_orders` | List orders; optional `?uid=1` or `?pid=2` |
| GET | `/get_order/:id` | Get one order |
| GET | `/get_orders/uid/:uid` | Orders for a user |
| GET | `/get_orders/pid/:pid` | Orders for a product |
| POST | `/add_order` | Create an order |
| PUT / PATCH | `/update_order/:id` | Update user, product, or date |
| DELETE | `/delete_order/:id` | Delete an order |

```json
POST /api/add_order
{
  "uid": 1,
  "pid": 2,
  "order_date": "2026-11-06T10:30:00.000Z"
}
```

`order_date` is optional on create and defaults to now. Responses include joined
convenience fields: `uname`, `email`, `pname`, `price`, and `qty`.

### Update-endpoint note

The brief lists `api/update/id` for both products and users, which is the same
path for two resources. Both are provided under explicit names:

- `PUT /api/update_product/:id`
- `PUT /api/update_user/:id`

Resource-namespaced forms also work: `PUT /api/products/update/:id` and
`PUT /api/users/update/:id`.

### REST aliases

```text
GET    /api/products           POST   /api/products
GET    /api/products/:id       PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/users              POST   /api/users
GET    /api/users/:id          PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/orders             POST   /api/orders
GET    /api/orders/:id         PUT    /api/orders/:id
DELETE /api/orders/:id
GET    /api/orders/user/:uid
GET    /api/orders/product/:pid
```

Health check: `GET /api/health` — also verifies that the Supabase schema exists.

---

## 5. Frontend component tree

```text
main.jsx
└── ThemeModeProvider (light/dark theme + CssBaseline)
    └── ToastProvider (global Snackbar notifications)
        └── BrowserRouter
            └── App
                └── AppLayout
                    ├── Sidebar navigation + ApiStatus
                    ├── AppBar (page title, theme toggle, avatar)
                    └── <Outlet />
                        ├── DashboardPage
                        │   ├── PageHeader
                        │   ├── StatCard × 4
                        │   ├── Recent orders table
                        │   └── Low-stock list
                        ├── ProductsPage
                        │   ├── PageHeader + Add action
                        │   ├── SearchField
                        │   ├── TableLoadingRows / EmptyState
                        │   ├── ProductFormDialog
                        │   └── ConfirmDialog (delete)
                        ├── UsersPage
                        │   ├── SearchField
                        │   ├── UserFormDialog
                        │   └── ConfirmDialog (delete)
                        ├── OrdersPage
                        │   ├── SearchField
                        │   ├── Customer/Product filter Autocompletes
                        │   │   (uses /get_orders/uid/:uid and /get_orders/pid/:pid)
                        │   ├── OrderFormDialog
                        │   └── ConfirmDialog (delete)
                        └── NotFoundPage
```

Shared pieces:

- `PageHeader`, `SearchField`, `StatCard`, `EmptyState`
- `TableLoadingRows` for skeleton loading states
- `ConfirmDialog` for destructive actions
- `useAsyncData` for loading/error/reload handling
- `ToastProvider` / `useToast` for success and error feedback
- `theme.js` + `ThemeModeProvider` for light/dark mode persisted in
  `localStorage`

The UI is responsive (temporary drawer below the `md` breakpoint) and includes
loading skeletons, empty states, inline validation, and API error alerts.

---

## 6. Configuration

### Backend (`backend/.env`)

```env
# Required
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

# Optional
PORT=5000
FRONTEND_DIST=../frontend/dist
DATABASE_SSL=               # auto-detected for *.supabase.co / *.supabase.com
DB_POOL_MAX=5
CORS_ORIGIN=http://localhost:5173
```

- Keep `DATABASE_URL` private. It contains the database password.
- Relative `FRONTEND_DIST` values are resolved from the `backend/` folder.
- `CORS_ORIGIN` accepts a comma-separated list, or `*` (default).

### Frontend (`frontend/.env`, optional)

```env
VITE_API_URL=/api
```

Use `/api` with the Vite proxy or single-process server. For a separately hosted
API, use the full URL including `/api`.

---

## 7. Scripts

### Root (recommended)

| Script | Description |
| --- | --- |
| `npm run setup` | Install backend and frontend dependencies |
| `npm run db:setup` | Apply `backend/supabase/schema.sql` to Supabase |
| `npm run seed` | Seed the database if the tables are empty |
| `npm run build` | Build React into `frontend/dist` |
| `npm start` | Start Express only (serves the existing build) |
| `npm run serve` | Build the frontend, then start the single Express process |

### Backend

| Script | Description |
| --- | --- |
| `npm run dev` | Start with file watching (`node --watch`) |
| `npm start` | Start normally |
| `npm run db:setup` | Apply the Supabase schema |
| `npm run build:frontend` | Build `frontend/dist` from the backend folder |
| `npm run serve` | Build the frontend, then start the server |
| `npm run seed` | Seed sample data if empty |
| `npm run seed -- --reset` | Clear rows, reset IDs, and re-seed |

### Frontend

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the build on port 4173 (proxies `/api`) |

---

## 8. Single-process deployment

`backend/src/app.js` serves `frontend/dist` after all API routes:

- Unknown `/api/*` paths return JSON 404s.
- Static files are served from `frontend/dist`.
- Other GET paths return `index.html`, so React Router deep links work.
- If the build is missing, `/` returns a 503 with build instructions.

For deployments, set `DATABASE_URL` in the host's environment, run
`npm run db:setup` once, then use `npm run serve` (or build separately and start
`backend/src/server.js`). Do not expose `DATABASE_URL` to the frontend.

### Deploying to Render

The error `Cannot find module '/opt/render/project/src/backend/server.js'` means
the Render **Start Command** pointed at the wrong file. Use one of these:

- `npm start` (recommended — starts `backend/src/server.js`), or
- `node backend/src/server.js`
- `node backend/server.js` (a compatibility shim is included)

Configure the Render service from the repository root:

| Setting | Value |
| --- | --- |
| Root Directory | *(leave empty / repository root)* |
| Build Command | `npm run setup && npm run db:setup && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Add the environment variable:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Optional: `CORS_ORIGIN` (not required because the UI and API share an origin).

The included `render.yaml` sets these values automatically for a Blueprint
deploy. `npm run db:setup` is safe to run on every build; it only creates
missing tables/indexes and refreshes grants. It does **not** seed or erase data.
Render supplies its own `PORT`; the server already uses it.

---

## 9. Implementation notes

- **Supabase connection:** `pg` pool with parameterized SQL, SSL enabled for
  Supabase hosts, tried/tested against the Supabase session pooler.
- **Passwords:** stored as `scrypt:<salt>:<hash>`; never returned by any API.
  There is intentionally no login/authentication flow.
- **Validation:** required fields, price/quantity ranges, email format, positive
  IDs, date validity, and foreign-key existence are checked server-side. The
  React forms validate before submitting.
- **Referential integrity:** orders require existing users/products; invalid
  references return `400`. Deletes cascade.
- **Email uniqueness:** enforced by a unique index and normalized to lowercase;
  duplicates return `409`.
- **Dates:** `order_date` is `timestamptz` and serialized as ISO UTC.
- **Pooling:** defaults to 5 connections; override with `DB_POOL_MAX`.
- **No credentials in the client:** the React app only calls the Express API.

### Troubleshooting

- **`DATABASE_URL is missing`:** create `backend/.env` from `.env.example` and
  paste the Supabase **Session pooler** connection string. Restart the server.
- **503 "schema is missing":** run `npm run db:setup`.
- **`28P01` / password authentication failed:** re-copy the connection string
  from Supabase and URL-encode special characters in the password.
- **`ENOTFOUND` / connection timeout:** use the **Session pooler** string rather
  than the direct database host; some networks only support IPv4.
- **Project paused:** free Supabase projects pause after inactivity. Resume the
  project in the dashboard.
- **Port 5000 in use:** change `PORT` in `backend/.env` and update
  `frontend/vite.config.js` proxy if using dev mode.
- **PowerShell blocks `npm`:** use `npm.cmd run <script>` or run
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **Reset all data:** `npm run seed -- --reset`.
- **Recreate schema:** run `npm run db:setup` again. For destructive schema
  changes, drop the three tables first, then re-run it.
