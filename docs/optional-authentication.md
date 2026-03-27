# Optional Authentication

SchemaDash supports optional authentication for self-hosted deployments.

## Modes

- `SCHEMADASH_AUTH_MODE=disabled`
  Keeps the current lightweight behavior. If the backend is reachable, SchemaDash bootstraps a placeholder local owner and persists data there. If the backend is unavailable, the editor continues in browser-local mode.
- `SCHEMADASH_AUTH_MODE=password`
  Requires a login before protected API routes can be used. The first administrator is initialized once through the bootstrap flow, project ownership is attached to the signed-in user, and sessions are issued through an HTTP-only cookie.
- `SCHEMADASH_AUTH_MODE=oidc`
  Delegates sign-in to an OpenID Connect provider such as Keycloak while still issuing SchemaDash's own HTTP-only session cookie for protected API access. The first administrator is assigned to the configured bootstrap OIDC email.

See [OIDC Authentication](./oidc-authentication.md) for the OIDC-specific setup guide, Keycloak example, and reverse-proxy notes.

## Bootstrap Options

For `SCHEMADASH_AUTH_MODE=password`, you have two supported first-admin paths.

Environment-assisted bootstrap:

- Set `SCHEMADASH_AUTH_EMAIL`
- Set `SCHEMADASH_AUTH_PASSWORD`
- Optionally set `SCHEMADASH_AUTH_DISPLAY_NAME`

SchemaDash creates that first local admin exactly once, stores the password as a salted `scrypt` hash, and then locks bootstrap.

Interactive bootstrap:

- Leave `SCHEMADASH_AUTH_EMAIL` and `SCHEMADASH_AUTH_PASSWORD` unset
- Optionally set `SCHEMADASH_BOOTSTRAP_SETUP_CODE` to an operator-managed setup code
- Optionally tune `SCHEMADASH_BOOTSTRAP_SETUP_CODE_TTL_MS`, default `900000`
- Optionally tune `SCHEMADASH_BOOTSTRAP_SETUP_CODE_MAX_ATTEMPTS`, default `10`

If `SCHEMADASH_BOOTSTRAP_SETUP_CODE` is unset, SchemaDash generates a short-lived setup code and logs it while the system is still uninitialized. The UI then exposes a one-time bootstrap form for the first admin.

For `SCHEMADASH_AUTH_MODE=oidc`, set:

- `SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL`

The first successful OIDC sign-in for that email becomes the initial SchemaDash administrator. Other OIDC identities are blocked until that bootstrap completes.

Related session settings:

- `SCHEMADASH_SESSION_TTL_HOURS` session lifetime, defaults to `168`
- `SCHEMADASH_SESSION_COOKIE_NAME` cookie name, defaults to `schemadash_session`
- `SCHEMADASH_SESSION_COOKIE_SECURE` optional override for the cookie `Secure` flag. By default it is enabled in production and disabled outside production.

## Security Notes

- Do not commit real credentials or real bootstrap setup codes into `.env` files.
- Set a strong `SCHEMADASH_SECRET_KEY` for production.
- If you use environment-assisted bootstrap, set a strong `SCHEMADASH_AUTH_PASSWORD`.
- If you use an operator-managed interactive bootstrap code, make it long and random.
- In production with authentication enabled, `SCHEMADASH_CORS_ORIGIN` must be an explicit origin, not `*`.
- When running behind a reverse proxy, set `SCHEMADASH_TRUST_PROXY` only for trusted forwarded-header hops.
- Bootstrap is locked after the first administrator is created. Removing that user later does not reopen public bootstrap automatically.
- SchemaDash stores only the hash of the interactive bootstrap setup code, not the plaintext value.
- Session cookies are `HttpOnly` and `SameSite=Lax`.
- Session records are persisted server-side and are invalidated on logout.

## Example Configuration

Interactive password bootstrap:

```dotenv
SCHEMADASH_AUTH_MODE=password
SCHEMADASH_CORS_ORIGIN=https://chartdb.example.com
SCHEMADASH_SECRET_KEY=replace-with-a-long-random-secret
SCHEMADASH_BOOTSTRAP_SETUP_CODE=replace-with-a-one-time-random-code
```

Environment-assisted password bootstrap:

```dotenv
SCHEMADASH_AUTH_MODE=password
SCHEMADASH_CORS_ORIGIN=https://chartdb.example.com
SCHEMADASH_SECRET_KEY=replace-with-a-long-random-secret
SCHEMADASH_AUTH_EMAIL=owner@example.com
SCHEMADASH_AUTH_PASSWORD=replace-with-a-long-random-password
SCHEMADASH_AUTH_DISPLAY_NAME=SchemaDash Owner
```

OIDC bootstrap:

```dotenv
SCHEMADASH_AUTH_MODE=oidc
SCHEMADASH_CORS_ORIGIN=https://chartdb.example.com
SCHEMADASH_SECRET_KEY=replace-with-a-long-random-secret
SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL=owner@example.com
SCHEMADASH_OIDC_ISSUER=https://sso.example.com/realms/chartdb
SCHEMADASH_OIDC_CLIENT_ID=chartdb
SCHEMADASH_OIDC_CLIENT_SECRET=replace-with-your-client-secret
SCHEMADASH_OIDC_REDIRECT_URL=https://chartdb.example.com/api/auth/oidc/callback
```

## Bootstrap Flow

1. Start the backend with authentication enabled.
2. If `SCHEMADASH_AUTH_EMAIL` and `SCHEMADASH_AUTH_PASSWORD` are set together, SchemaDash initializes the first admin once and immediately exposes the sign-in page.
3. If those env vars are unset in password mode, open the SchemaDash UI and complete the bootstrap form with the setup code from `SCHEMADASH_BOOTSTRAP_SETUP_CODE` or the latest startup log entry.
4. In OIDC mode, sign in with the account whose email matches `SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL`.
5. After the first admin is created, bootstrap is locked and normal sign-in behavior takes over.
6. Use `Log out` from the editor toolbar to invalidate the current session.

## API Behavior

- Public routes:
  - `GET /api/health`
  - `GET /api/livez`
  - `GET /api/readyz`
  - `GET /api/auth/session`
  - `POST /api/auth/bootstrap`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/shared/projects/:id/:shareToken`
  - `GET /api/shared/projects/:id/:shareToken/diagrams/:diagramId`
  - `GET /api/shared/diagrams/:id/:shareToken`
- Protected routes:
  - persistence routes under `/api/app`, `/api/projects`, `/api/collections`, `/api/diagrams`, `/api/backups`
  - schema sync routes under `/api/connections`, `/api/schema`, and `/api/audit`
