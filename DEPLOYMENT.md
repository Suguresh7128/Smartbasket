# Deployment guide (Render backend + Vercel frontend)

This repository includes GitHub Actions to deploy the frontend to Vercel and trigger a Render deploy for the backend. Follow these steps:

1. Add repository secrets (GitHub → Settings → Secrets → Actions):
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_API_URL`
   - `RENDER_API_KEY`
   - `MONGODB_URI`, `REDIS_URL`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `ANTHROPIC_API_KEY` (optional)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` (or let the server generate)
   - `CLIENT_URL` (will be set to Vercel URL)

2. Vercel
   - Import the `web` directory as a Vercel project (you mentioned this is already connected).
   - Ensure `NEXT_PUBLIC_API_URL` repo secret is set to your backend API URL (e.g., `https://<backend>.onrender.com/api`).
   - On push to `main` the `deploy-vercel.yml` workflow will run and deploy the frontend.

3. Render
   - Create a new Web Service named `smartbasket-api` from the repository or use the `devops/render.yaml` file in the `devops` folder to configure the service.
   - Set the environment variables in the Render service UI (the important ones listed above).
   - If you prefer automation, add `RENDER_API_KEY` as a secret and use the `deploy-render-backend.yml` workflow to trigger a deploy (it will fail if the service name is not found).

4. After Vercel deploy completes, set `CLIENT_URL` in Render to your Vercel URL and run the seed script in the backend to create the admin user:

```bash
# from your local machine with the correct RENDER_API_KEY you can use render CLI
# or use Render shell to run:
# node src/utils/seed.js
```

5. Smoke tests
   - Visit the Vercel frontend URL, sign in with the seeded admin, upload a bill, and verify it appears in the backend `/api/bills`.

If you want I can open a PR that adds a small script to call the seed endpoint after deploy, but it requires secure handling of secrets.
