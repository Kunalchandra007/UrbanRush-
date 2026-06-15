# UrbanRush — Hosting a Live URL for Judges

Two paths. **Option A (tunnel)** gets a public URL in ~5 minutes for the demo.
**Option B (real deploy)** is a proper cloud deployment.

> Before either: the frontend now reads the backend URL from `VITE_API_BASE`
> (falls back to `http://localhost:8000`). Set it to your backend's public URL.

---

## Option A — Fastest live URL (tunnel your local machine) ⏱️ ~5 min

Best for a hackathon demo where judges just need a working link.

1. **Run both servers locally** (backend on 8000, frontend on 5173).
2. **Install a tunnel** — Cloudflare Tunnel (no signup) or ngrok:
   ```bash
   # Cloudflare (no account needed)
   winget install --id Cloudflare.cloudflared
   # OR ngrok: https://ngrok.com/download
   ```
3. **Tunnel the backend:**
   ```bash
   cloudflared tunnel --url http://localhost:8000
   # → gives e.g. https://abc-backend.trycloudflare.com
   ```
4. **Point the frontend at it** — create `frontend/.env`:
   ```env
   VITE_API_BASE=https://abc-backend.trycloudflare.com
   ```
   Restart `npm run dev` (so Vite picks up the env).
5. **Tunnel the frontend:**
   ```bash
   cloudflared tunnel --url http://localhost:5173
   # → share THIS url with judges
   ```

Notes: keep your laptop awake + servers running during judging. Remove the
React DevTools line (`<script src="http://localhost:8097">`) from `index.html` first.

---

## Option B — Proper cloud deploy

### Backend → Render (free tier) or Railway
1. Push the repo to GitHub.
2. New **Web Service** → root = `backend/`.
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment variables:**
   ```
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=ap-south-1
   BEDROCK_MODEL_ID=apac.anthropic.claude-3-5-sonnet-20241022-v2:0
   ```
4. Note the public URL, e.g. `https://urbanrush-api.onrender.com`.
   (CORS is already open to all origins.)

### Frontend → Vercel or Netlify
1. New project → root = `frontend/`.
   - Build: `npm run build` · Output: `dist`
2. **Environment variable:**
   ```
   VITE_API_BASE=https://urbanrush-api.onrender.com
   ```
3. Deploy → you get e.g. `https://urbanrush.vercel.app` — share this with judges.

### Production cleanups
- Remove `<script src="http://localhost:8097"></script>` from `frontend/index.html`.
- Serve over **HTTPS** (Vercel/Netlify do this) — required for mic + geolocation.
- `data/user_memory/` is on-disk; on ephemeral hosts it resets on redeploy (fine for demo; move to DynamoDB/Redis for persistence later).

---

## Option C — AWS-native (matches the pitch)

- **Backend:** Docker image → **ECS Fargate** (or EC2) behind an ALB. Stateless, scales horizontally.
- **Frontend:** `npm run build` → **S3 + CloudFront** (set `VITE_API_BASE` at build time).
- **AI:** already AWS Bedrock (`ap-south-1`). For load, switch to **Provisioned Throughput**.

---

## Quick verification after deploy

```bash
curl https://<backend-url>/health           # {"status":"ok"}
```
Open the frontend URL in Chrome/Edge → type "guests in 30 minutes" → cart builds.
If the cart builds but text is generic, AWS Bedrock billing isn't active yet — the
rule-based fallback is running (still fully demoable).
