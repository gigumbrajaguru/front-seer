# Deploying the frontend to myseer.xyz

The production config already points at the API:
`src/environments/environment.prod.ts` → `apiBaseUrl: 'https://host.myseer.xyz'`.

Must be served over **HTTPS** — the session cookie set by the API is `Secure`,
and the browser only sends it from a secure origin.

## 1. Build

```bash
npm ci
npm run build            # production build (Angular default)
# output: dist/front-seer/browser/
```

## 2. Serve the static files (nginx) for myseer.xyz

```nginx
server {
    listen 443 ssl http2;
    server_name myseer.xyz www.myseer.xyz;

    ssl_certificate     /etc/letsencrypt/live/myseer.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myseer.xyz/privkey.pem;

    root /var/www/myseer.xyz;     # contents of dist/front-seer/browser/
    index index.html;

    # App uses hash routing (/#/...), so index.html covers all routes.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
server {
    listen 80;
    server_name myseer.xyz www.myseer.xyz;
    return 301 https://$host$request_uri;
}
```

Deploy:

```bash
sudo rsync -a --delete dist/front-seer/browser/ /var/www/myseer.xyz/
sudo certbot --nginx -d myseer.xyz -d www.myseer.xyz
```

## 3. Verify

Open https://myseer.xyz, sign in, and confirm API calls to
`https://host.myseer.xyz/api/...` succeed (no CORS errors) and the profile loads.
Cross-subdomain cookies work because both sites are under `myseer.xyz`.

> CORS, cookies, and CSRF are configured on the API side — see
> `Seer-Predictions/DEPLOY.md`.
