# Sidebar User Menu Integration Audit

## Scope

- Task branch: `feat/11-sidebar-user-menu-replace-social-buttons`
- Target UI surface: `frontend/src/pages/editor-page/editor-sidebar/editor-sidebar.tsx`
- Goal: replace the footer Discord/Twitter actions with a native SchemaDash user account trigger and anchored menu.

## Current Footer Rendering

- `frontend/src/pages/editor-page/editor-sidebar/editor-sidebar.tsx`
  - The bottom footer currently renders `footerItems`.
  - `footerItems` contains:
    - `Discord` opening `https://discord.gg/QeFwyWSKwC`
    - `Twitter` opening `https://x.com/intent/follow?screen_name=jonathanfishner`
- The editor sidebar also renders `CurrentDiagramShareButton` just above the footer.

## Existing Native Primitives To Reuse

- Sidebar layout and footer/button primitives:
  - `frontend/src/components/sidebar/sidebar.tsx`
- Avatar primitive:
  - `frontend/src/components/avatar/avatar.tsx`
- Dropdown primitive:
  - `frontend/src/components/dropdown-menu/dropdown-menu.tsx`
- Separator primitive:
  - `frontend/src/components/separator/separator.tsx`
- Button primitive:
  - `frontend/src/components/button/button.tsx`

## Existing Data / Action Sources

- Auth session and logout:
  - `frontend/src/hooks/use-auth.ts`
  - `frontend/src/context/auth-context/auth-context.ts`
  - `frontend/src/context/auth-context/auth-provider.tsx`
- Theme state:
  - `frontend/src/hooks/use-theme.ts`
  - `frontend/src/context/theme-context/theme-provider.tsx`
- Editor sharing dialog integration:
  - `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
  - `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
  - `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
- Dashboard/profile/settings routes:
  - `frontend/src/router.tsx`

## Valid Existing Routes / Actions

- Safe routes already present:
  - `/`
  - `/profile`
  - `/settings`
  - `/admin` for admins only
- Safe existing editor action:
  - open the existing sharing settings dialog for the current saved diagram
- Safe existing session action:
  - `logout()`
- Safe existing theme action:
  - `setTheme('light' | 'dark' | 'system')`

## Reference Items Audit

- Can be wired safely:
  - dashboard/library navigation using the existing root route
  - profile/settings navigation
  - diagram visibility/share settings using the existing sharing dialog
  - light/dark theme switch using the existing theme context
  - logout using the existing auth context
- Should not be invented in this task:
  - embed links
  - invite member as a separate dedicated route/action
  - support chat as a chat-specific native workflow

## Styling Guidance

- Keep the sidebar trigger inside the existing footer slot and reuse `SidebarMenu`, `SidebarMenuItem`, and `SidebarMenuButton`.
- Keep the menu compact like the reference image, but build it with the existing dropdown/menu/avatar/button primitives.
- Avoid new route trees, feature folders, or standalone design-language tokens for this task.
