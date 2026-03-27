# Frontend Repair Audit (2026-03-27)

## Scope

- Audited the current refactor branch in place without reverting structure.
- Checked package/workspace scripts, Vite, PostCSS, Tailwind, TypeScript aliases, frontend entrypoints, auth entry screens, and public asset wiring.

## Findings

- `frontend` starts and the router/auth modules resolve, so the refactor did not leave the app in a missing-import state.
- `npm run build:web` and `npm run test:web:ci` are healthy, which narrowed the breakage to runtime styling instead of compile-time failures.
- The login/bootstrap screens render as mostly unstyled HTML in a browser screenshot even though `index.css` and `globals.css` load.
- Tailwind base styles are present, but utility classes such as `min-h-screen`, `bg-stone-950`, and button sizing/background classes are absent from the generated CSS.
- Root cause: `frontend/tailwind.config.js` uses relative `content` globs while Vite is invoked from the repository root. Tailwind therefore scans the wrong directory and misses the real `frontend/src/**/*.tsx` files.

## Repair Targets

- Update Tailwind content paths to resolve from the `frontend` config directory itself.
- Rebuild and browser-smoke the auth entry screen to confirm utility classes and button styling are restored.
