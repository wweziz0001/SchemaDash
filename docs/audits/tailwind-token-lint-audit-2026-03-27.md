# Tailwind Token Lint Audit (2026-03-27)

## Findings

- The semantic Tailwind token system is still present in `frontend/tailwind.config.js`.
- `theme.extend.colors` still defines shadcn-style tokens such as `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `card`, `popover`, and `sidebar`.
- `theme.extend.fontFamily.primary`, `theme.extend.keyframes`, and `theme.extend.animation` are also still present.
- The matching CSS custom properties are still defined in `frontend/src/globals.css` under both `:root` and `.dark`.
- Runtime styling works because PostCSS is already pointed at `frontend/tailwind.config.js`.

## Root Cause

- ESLint's Tailwind plugin runs from the repository root.
- The plugin defaults to looking for a Tailwind config at the root when no explicit setting is provided.
- This repository keeps the active Tailwind config in `frontend/tailwind.config.js`, so the plugin was linting with an empty/default Tailwind context.
- That caused false positives for semantic token classes such as `bg-background`, `text-muted-foreground`, `font-primary`, `animate-accordion-down`, and the sidebar token utilities.

## Repair Target

- Point the ESLint Tailwind plugin directly at `frontend/tailwind.config.js` and the frontend CSS sources so lint uses the same design-token context as the build.
