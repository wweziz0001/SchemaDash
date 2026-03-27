# OIDC Authentication

SchemaDash can use a standard OpenID Connect provider for self-hosted sign-in by setting `SCHEMADASH_AUTH_MODE=oidc`.

This mode is designed for Keycloak and other providers that support the standard authorization code flow with PKCE.

## How it works

- SchemaDash redirects the browser to your OIDC provider.
- The callback is validated with a signed, short-lived flow cookie, `state`, `nonce`, and PKCE.
- After the provider callback succeeds, SchemaDash links the identity by `issuer + subject`.
- On first sign-in, SchemaDash can provision a local user record from the provider email and profile claims.
- Protected API access still uses SchemaDash's own HTTP-only session cookie. Provider tokens are not stored in the browser by SchemaDash.

## Required environment variables

When `SCHEMADASH_AUTH_MODE=oidc`, set:

- `SCHEMADASH_OIDC_ISSUER`
- `SCHEMADASH_OIDC_CLIENT_ID`
- `SCHEMADASH_OIDC_REDIRECT_URL`

Optional:

- `SCHEMADASH_OIDC_CLIENT_SECRET`
  Leave this unset only when your provider client is configured as a public client.
- `SCHEMADASH_OIDC_LOGOUT_URL`
  Use this when you want the SchemaDash logout button to continue to the provider logout endpoint.
- `SCHEMADASH_OIDC_SCOPES`
  Defaults to `openid profile email`.

Shared auth/session settings:

- `SCHEMADASH_CORS_ORIGIN`
- `SCHEMADASH_TRUST_PROXY`
- `SCHEMADASH_SECRET_KEY`
- `SCHEMADASH_SESSION_TTL_HOURS`
- `SCHEMADASH_SESSION_COOKIE_NAME`
- `SCHEMADASH_SESSION_COOKIE_SECURE`

## Local development

When using the normal Vite dev server, the browser talks to `http://localhost:5173` and Vite proxies `/api` to the backend.

That means your OIDC redirect URL should usually point to the frontend origin, not directly to port `4010`:

```dotenv
SCHEMADASH_AUTH_MODE=oidc
SCHEMADASH_CORS_ORIGIN=http://localhost:5173
SCHEMADASH_SECRET_KEY=replace-with-a-local-dev-secret

SCHEMADASH_OIDC_ISSUER=http://localhost:8080/realms/chartdb
SCHEMADASH_OIDC_CLIENT_ID=chartdb
SCHEMADASH_OIDC_CLIENT_SECRET=replace-with-keycloak-client-secret
SCHEMADASH_OIDC_REDIRECT_URL=http://localhost:5173/api/auth/oidc/callback
SCHEMADASH_OIDC_LOGOUT_URL=http://localhost:8080/realms/chartdb/protocol/openid-connect/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A5173&client_id=chartdb
```

Run SchemaDash normally:

```bash
npm install
npm run dev:server
npm run dev:web
```

## Keycloak-compatible example

Typical Keycloak values look like this:

```dotenv
SCHEMADASH_AUTH_MODE=oidc
SCHEMADASH_CORS_ORIGIN=https://chartdb.example.com
SCHEMADASH_SECRET_KEY=replace-with-a-long-random-secret
SCHEMADASH_SESSION_COOKIE_SECURE=true

SCHEMADASH_OIDC_ISSUER=https://sso.example.com/realms/chartdb
SCHEMADASH_OIDC_CLIENT_ID=chartdb
SCHEMADASH_OIDC_CLIENT_SECRET=replace-with-keycloak-client-secret
SCHEMADASH_OIDC_REDIRECT_URL=https://chartdb.example.com/api/auth/oidc/callback
SCHEMADASH_OIDC_LOGOUT_URL=https://sso.example.com/realms/chartdb/protocol/openid-connect/logout?post_logout_redirect_uri=https%3A%2F%2Fchartdb.example.com&client_id=chartdb
```

Keycloak client settings to match:

- Access type: confidential when you set `SCHEMADASH_OIDC_CLIENT_SECRET`
- Valid redirect URIs: include your full SchemaDash callback URL
- Web origins: include your SchemaDash origin
- Standard flow: enabled
- Direct access grants: not required for this integration

## Reverse proxy notes

- Route `/api/auth/oidc/callback` through to the SchemaDash backend.
- Keep the externally visible callback URL exactly aligned with `SCHEMADASH_OIDC_REDIRECT_URL`.
- If TLS terminates at the proxy, forward `X-Forwarded-Proto: https` and keep `SCHEMADASH_SESSION_COOKIE_SECURE=true` in production.
- Set `SCHEMADASH_TRUST_PROXY=1` when traffic always passes through one trusted reverse-proxy hop that sanitizes forwarded headers.
- Prefer serving the frontend and backend from the same external origin so session cookies and OIDC redirects stay simple.
- If you deploy the frontend and backend on different origins, `SCHEMADASH_CORS_ORIGIN` must be the exact frontend origin.

## User linking behavior

- Existing SchemaDash users are reused when the provider email matches an existing account.
- Once linked, future sign-ins use the stable provider identity (`issuer + subject`) instead of relying on email alone.
- New users are provisioned with `authProvider=oidc` and a display name from provider claims such as `name` or `preferred_username`.

## Security notes

- Never commit real client secrets.
- In production, use HTTPS for both `SCHEMADASH_OIDC_REDIRECT_URL` and `SCHEMADASH_OIDC_LOGOUT_URL`.
- Make sure your provider returns an email claim because SchemaDash uses it for first-login account matching.
- Rotate `SCHEMADASH_SECRET_KEY` deliberately; changing it invalidates signed OIDC flow cookies and encrypted backend secrets.
