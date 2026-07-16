# Plant Pot Server – Plant Shop API

### **Programming Hero | Batch-13 | SCIC | Assignment on TypeScript | MERN Stack Development Project**

* **Project Name:** Plant Pot – Plant Shop (Backend)
* **Server GitHub Repository:** [https://github.com/rahad404/plant-pot-server](https://github.com/rahad404/plant-pot-server)

---

## Project Description

The **Plant Pot Server** is a secure, high-performance RESTful API built with **Express.js**, **TypeScript**, and the **MongoDB Native Driver**. It serves as the backend engine for the Plant Pot plant shop platform, managing plant inventory, customer orders, care schedules, user roles, and reviews. The API supports role-based access control (Admin, User), advanced plant search with filtering and pagination, and an automated plant care watering system. Authentication is handled via **JWT (jsonwebtoken)** with Bearer token verification.

---

## Key Features

1. **Role‑Based Access Control (RBAC):** Two distinct roles – `admin`, `user` – enforced by JWT verification and dedicated middleware.
2. **Plant Catalog Management:** Admins can create, update, and delete plants. Public users can browse with advanced search, category filtering, price range, rating filters, and sorting.
3. **Automated Care Schedule:** When a user purchases a plant, a care schedule is automatically created with a 7-day watering interval. Users can mark plants as watered, and the next watering date is recalculated.
4. **Review & Rating System:** Users can submit reviews (1–5 stars) on purchased plants. The plant's average rating and count are recalculated via MongoDB aggregation pipeline on every new review.
5. **Order Lifecycle:** Users create orders for plants; admins can manage all orders and update statuses (paid, processing, shipped, delivered, cancelled).
6. **Customer Dashboard:** Users can view their purchased plants, order history, and manage watering schedules from a single dashboard.
7. **Regex Injection Prevention:** All user search input is sanitized before passing to MongoDB `$regex` queries, preventing ReDoS and unexpected pattern matching.
8. **Ownership Enforcement:** Users can only modify their own profiles and care schedules. The server verifies JWT email against resource ownership.

---

## Tech Stack

* **Runtime & Framework:** Node.js (>= 18.0.0) & Express.js 4.x
* **Language:** TypeScript 5.x
* **Database Driver:** MongoDB Native Driver (`mongodb` v6.7) – no Mongoose
* **Authentication:** JWT via `jsonwebtoken`
* **Environment Configuration:** `dotenv`
* **Cross‑Origin Support:** `cors`
* **Dev Tooling:** `ts-node-dev`
* **Deployment:** Render / Railway / any Node.js hosting

---

## Project Structure

```
src/
├── index.ts                 # App entry — connects DB, mounts routes, starts listening
├── db.ts                    # Singleton MongoDB connection + getCollections()
├── middleware/
│   ├── verifyToken.ts       # JWT Bearer token verification
│   └── verifyAdmin.ts       # Admin role verification
├── routes/
│   ├── auth.ts              # POST /api/auth/jwt — issues JWT
│   ├── plants.ts            # /api/plants — CRUD, search, reviews
│   ├── orders.ts            # /api/orders — customer order creation & history
│   ├── adminOrders.ts       # /api/admin/orders — admin order management
│   ├── users.ts             # /api/users — user management & role promotion
│   ├── dashboard.ts         # /api/dashboard — customer dashboard
│   ├── careSchedule.ts      # /api/care-schedule — watering tracker
│   └── contact.ts           # /api/contact — contact form
├── utils/
│   ├── regex.ts             # Regex escape utility (prevents injection)
│   └── careSchedule.ts      # Next-watering date calculator
└── types/
    └── express/
        └── index.d.ts       # TypeScript augmentation for Express Request
```

---

## API Endpoints

All endpoints are relative to the base URL:
**`http://localhost:5000`** (development) or your production domain.

> **Authentication:** Most endpoints require a valid JWT token sent in the `Authorization` header as `Bearer <token>`. The token payload contains `{ sub, email, name }`. Role‑specific endpoints are noted with `Admin` / `User`.

---

### 1. Health & Root Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET`  | `/`      | Public        | Health ping — returns `{ message: "Plant Shop API is running" }` |
| `GET`  | `/health`| Public        | Platform health check — returns `{ status: "ok", uptime: <seconds> }` |

---

### 2. Auth Routes (`/api/auth`)

| Method | Endpoint         | Auth Required | Description |
|--------|------------------|---------------|-------------|
| `POST` | `/api/auth/jwt`  | Public        | Issues a JWT. Body: `{ email (required), name?, uid? }`. Returns `{ token }` with 7-day expiry. |

---

### 3. Plant Routes (`/api/plants`)

| Method   | Endpoint                      | Auth Required | Description |
|----------|-------------------------------|---------------|-------------|
| `GET`    | `/api/plants/categories`      | Public        | Get distinct plant categories with generated slugs. |
| `GET`    | `/api/plants/`                | Public        | List plants with filtering, search, sorting, pagination. Query params: `search`, `category`, `minPrice`, `maxPrice`, `rating`, `light`, `sort` (`price_asc`/`price_desc`/`rating_desc`), `page`, `limit`. |
| `GET`    | `/api/plants/:id`             | Public        | Get single plant details by ObjectId. |
| `POST`   | `/api/plants/`                | `Admin`       | Create a new plant. Body: `{ name/title, price, category, ... }` |
| `PUT`    | `/api/plants/:id`             | `Admin`       | Update a plant by ObjectId. |
| `DELETE` | `/api/plants/:id`             | `Admin`       | Delete a plant by ObjectId. |
| `POST`   | `/api/plants/:id/reviews`     | `User`        | Submit a review. Body: `{ rating (1-5), comment? }`. Recalculates `ratingAvg`/`ratingCount` on the plant. |
| `GET`    | `/api/plants/:id/reviews`     | Public        | Get paginated reviews for a plant. Query: `page`, `limit`. |

---

### 4. Order Routes (`/api/orders`)

| Method | Endpoint         | Auth Required | Description |
|--------|------------------|---------------|-------------|
| `POST` | `/api/orders/`   | `User`        | Create an order. Body: `{ plantId, plantName, price }`. Auto-creates a care schedule with 7-day watering interval. |
| `GET`  | `/api/orders/`   | `User`        | Get current user's orders (filtered by `userEmail` from JWT). |

---

### 5. Admin Order Routes (`/api/admin/orders`)

| Method | Endpoint                  | Auth Required | Description |
|--------|---------------------------|---------------|-------------|
| `GET`  | `/api/admin/orders/`      | `Admin`       | List all orders with pagination and search. Query: `page`, `limit`, `search` (searches plantName, userName, userEmail). |
| `PATCH`| `/api/admin/orders/:id`   | `Admin`       | Update order status. Body: `{ status }`. Allowed: `paid`, `processing`, `shipped`, `delivered`, `cancelled`. |

---

### 6. User Routes (`/api/users`)

| Method | Endpoint                  | Auth Required | Description |
|--------|---------------------------|---------------|-------------|
| `GET`  | `/api/users/`             | `Admin`       | List all users (name, email, image, role, createdAt). |
| `GET`  | `/api/users/role/:email`  | `User`        | Get a specific user's role by email. |
| `GET`  | `/api/users/:email`       | `User`        | Get a specific user's profile by email. |
| `PATCH`| `/api/users/admin/:id`    | `Admin`       | Promote a user to admin (sets `role: "admin"`). |
| `PATCH`| `/api/users/:id`          | `User`        | Update own profile (name, image). Enforces ownership — users can only update their own profile. |

---

### 7. Dashboard Routes (`/api/dashboard`)

| Method | Endpoint                              | Auth Required | Description |
|--------|---------------------------------------|---------------|-------------|
| `GET`  | `/api/dashboard/my-plants`            | `User`        | Get current user's care schedules (purchased plants with watering info). |
| `GET`  | `/api/dashboard/orders`               | `User`        | Get current user's orders. |
| `PATCH`| `/api/dashboard/care-schedule/:id/watered` | `User`    | Mark a plant as watered. |

---

### 8. Care Schedule Routes (`/api/care-schedule`)

| Method | Endpoint                              | Auth Required | Description |
|--------|---------------------------------------|---------------|-------------|
| `PATCH`| `/api/care-schedule/:id/watered`      | `User`        | Mark a plant as watered. Verifies ownership. Updates `lastWatered` and recalculates `nextWatering` based on frequency. |

---

### 9. Contact Routes (`/api/contact`)

| Method | Endpoint          | Auth Required | Description |
|--------|-------------------|---------------|-------------|
| `POST` | `/api/contact/`   | Public        | Submit a contact message. Body: `{ name, email, message }`. |

---

## Database Collections

| Collection | Description |
|------------|-------------|
| `plants` | Plant product catalog |
| `orders` | Customer purchase orders |
| `users` | User accounts (with `role` field) |
| `reviews` | Plant reviews and ratings |
| `careSchedules` | Plant care / watering schedules |
| `contacts` | Contact form submissions |

---

## Getting Started (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/rahad404/plant-pot-server.git
cd plant-pot-server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Fill in the `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=plantShopDB
ACCESS_TOKEN_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

### 4. Run the development server
```bash
npm run dev
```

The server will start at `http://localhost:5000`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run typecheck` | Type-check without emitting files |

---

## Deployment

1. **Build command:** `npm install && npm run build`
2. **Start command:** `npm start` (runs `node dist/index.js`)
3. **Environment variables** (set in platform dashboard):
   - `MONGODB_URI` – MongoDB connection string
   - `DB_NAME` – Database name (default: `plantShopDB`)
   - `ACCESS_TOKEN_SECRET` – JWT signing secret
   - `CLIENT_URL` – Comma-separated frontend origin(s), e.g. `https://your-app.vercel.app`
   - `PORT` – Most platforms inject this automatically

---

## License

This project is part of **Programming Hero | Batch-13 | SCIC** coursework.
