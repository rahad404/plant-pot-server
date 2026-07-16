# Plant Shop Backend

Simple, single-layer Express + TypeScript API. No fancy architecture — routes, two
middlewares, a db helper, done.

## Structure

```
src/
  index.ts                # app entry — connects DB, then starts listening
  db.ts                   # single Mongo connection, getCollections()
  middleware/
    verifyToken.ts        # reads Authorization: Bearer <jwt>
    verifyAdmin.ts        # checks users collection for role === "admin"
  utils/
    careSchedule.ts
    regex.ts
  routes/
    auth.ts               # POST /api/auth/jwt  → issues the JWT your frontend sends back
    plants.ts              → /api/plants
    orders.ts               → /api/orders          (customer: create + view own orders)
    adminOrders.ts          → /api/admin/orders     (admin: list all + update status)
    careSchedule.ts         → /api/care-schedule
    dashboard.ts             → /api/dashboard
    contact.ts               → /api/contact
    users.ts                 → /api/users
```

**Note on auth:** your original routes referenced `req.user.email/sub/name` but didn't
include a login endpoint. I added `POST /api/auth/jwt` — after your frontend finishes
login (Firebase, NextAuth, whatever), POST `{ email, name, uid }` there, get a JWT back,
and send it as `Authorization: Bearer <token>` on every protected request. If you
already had a different auth flow, just swap out `verifyToken.ts`.

## Local dev

```bash
cp .env.example .env      # fill in MONGODB_URI, ACCESS_TOKEN_SECRET, etc.
npm install
npm run dev
```

## Deploying (Render / Railway / Fly / a VPS — anything that runs long-lived Node)

1. **Build command:** `npm install && npm run build`
2. **Start command:** `npm start` (runs `node dist/index.js` — never point the platform
   at `src/index.ts` directly, it won't have ts-node in production)
3. **Environment variables** (set these in the platform's dashboard, not in a committed `.env`):
   - `MONGODB_URI`
   - `DB_NAME`
   - `ACCESS_TOKEN_SECRET`
   - `CLIENT_URL` — comma-separated list of your **exact** frontend origin(s), e.g.
     `https://your-app.vercel.app` (no trailing slash). This is the #1 cause of
     "works locally, breaks in prod" — CORS silently rejects mismatched origins.
   - `PORT` — most platforms inject this automatically; the app reads `process.env.PORT`
     and falls back to 5000, so you don't need to set it on Render/Railway.

### If you're deploying to Vercel specifically

Vercel runs Node as serverless functions, not a persistent server — `app.listen()`
doesn't work there the normal way, and a per-request Mongo connection will exhaust
your connection pool fast. For an Express app like this, **Render or Railway are much
simpler** (free tier on both, zero config beyond the env vars above). If you must use
Vercel, you'd need to wrap `app` as a serverless handler and cache the Mongo client
across invocations — happy to set that up separately if you want to go that route.

## Common deploy failures this setup avoids

- **App crashes/404s on every route right after deploy:** almost always the DB not
  being connected before `app.listen()` fires. Here, `connectDB()` is awaited first;
  if it fails, the process exits with a clear log instead of serving requests against
  an undefined collection.
- **CORS errors in the browser console:** `CLIENT_URL` must match the deployed
  frontend origin exactly (protocol + domain, no path, no trailing slash).
- **"Cannot find module" in production:** make sure the build step actually ran —
  `dist/` must exist before `npm start`. Some platforms cache `node_modules` and skip
  reinstall/build; if routes go missing after a deploy, force a clean rebuild.
- **401s on every protected route:** `ACCESS_TOKEN_SECRET` isn't set on the deploy
  platform, or the frontend is sending a token signed with a different secret
  (e.g. still pointed at your old backend).

## Health check

`GET /health` → `{ status: "ok", uptime: <seconds> }` — point your platform's health
check here if it asks for one.
