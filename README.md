# Casa Wiki · Admin

Panel de administración de Casa Wiki (Next.js 15). Es un deploy independiente que consume la API propia de Casa Wiki y comparte el cliente OAuth de Google con el storefront.

- Panel: https://casa-wiki-admin.vercel.app
- API: https://casa-wiki-api.vercel.app
- Tienda: https://casawiki.vercel.app
- Repo: `Ariel-Sq/casa-wiki-admin`

## Acceso

1. HTTP Basic Auth (variables `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASS`).
2. Login con Google en el panel. El backend valida el rol en cada request: solo `owner`, `admin` o `editor` entran al catálogo; `sales` a pedidos/reseñas; `owner` a usuarios e historial.
3. La cuenta definida en `OWNER_EMAIL` del backend se resuelve siempre como `owner`.

## Desarrollo

```bash
source ~/.nvm/nvm.sh && nvm use 22
cd ~/projects/casa-wiki-admin
pnpm install
cp .env.example .env.local
pnpm dev   # http://localhost:3004
```

Variables principales: `BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_SHARED_SECRET`, `ADMIN_BASIC_AUTH_USER`, `ADMIN_BASIC_AUTH_PASS`.

El callback de Google para este panel es:

```
https://casa-wiki-admin.vercel.app/api/auth/callback/google
http://localhost:3004/api/auth/callback/google
```

## Deploy

Proyecto Vercel `casa-wiki-admin`, conectado al repo `Ariel-Sq/casa-wiki-admin` (auto-deploy en `main`). Build: `next build`; start: `next start -p 3003`.
