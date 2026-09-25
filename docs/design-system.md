# Design System

## Tokens

Colors, radius, and typography are defined as CSS custom properties in `src/index.css` under
Tailwind v4's `@theme`, with a dark-mode override block (`prefers-color-scheme` + a
`data-theme="dark"` escape hatch for a future manual toggle). Semantic tokens only —
`primary`/`secondary`/`muted`/`accent`/`destructive`/`success`/`warning` — never raw hex values in
components.

## Primitives

`src/components/ui/` is a small, hand-built set in the shadcn/ui style (function components,
`class-variance-authority` for variants, Tailwind for styling) rather than a generated component
library: `Button` (+ `buttonVariants` for styling non-button elements like `Link` consistently),
`Input`, `Select`, `Label`, `Card`/`CardHeader`/`CardTitle`/`CardContent`/`CardFooter`, `Badge`,
`Skeleton`, `Tabs`, `Dialog`.

`Dialog` is an accessible modal. It moves focus into its body on open, traps Tab/Shift+Tab,
closes on Escape or overlay click (`preventClose` blocks dismissal while a mutation runs), locks
background scroll, uses generated ids for `aria-labelledby`, and restores focus on close. It keeps
`onClose` in a ref so parent re-renders never steal focus mid-typing.

`Tabs` implements the WAI-ARIA tabs pattern with roving tabindex and ←/→/Home/End. Pass `idBase`
and wrap content in `TabPanel` to link tabs and panels.

## Feedback

`src/components/feedback/`:

- `EmptyState`; `ErrorState` (full or `compact`, renders `ApiError.message`, optional retry).
- `QueryState`: loading → error → empty → content. Error is checked before empty, so a failed
  request never looks like "nothing here".
- `ErrorBoundary`, `SectionBoundary`, `GlobalErrorBoundary`, `RouteErrorBoundary`.
- `ConfirmDialog`: every destructive action (archive, check-out, void, cancel) states its
  consequence. Never `window.alert` / `window.confirm`.
- `PageSpinner`, and `ToastProvider` / `useToast()`. Error toasts are `role="alert"` and stay until
  dismissed; success/info toasts are polite and auto-dismiss.

## Data display

`src/components/data-table/DataTable.tsx` is the one reusable table: columns + row renderer in,
loading/empty/error/pagination handled once, optional screen-reader `caption`. Clickable rows stay
real table rows (focusable, Enter/Space), because `role="button"` on a `<tr>` hides row/cell
semantics. `FilterBar` + `SearchInput` (debounced, URL-synced) sit above it, and `paginate` handles
endpoints that return full lists.

`MetricCard` (optional `hint` and `to` link) is the only stat tile. `StatusBadge` renders any
status from `statusConfig`: always a text label, plus an icon for attention/completion states.
Dashboard and 360 sections use `DashboardCard` for a consistent heading and per-section
loading/error.

## Visual tone

Professional and operational, not a marketing page: minimal shadows, no gradients or
glassmorphism, generous whitespace, and status communicated with both color and text (never color
alone, per the accessibility requirements).

## Responsive behavior

Desktop-first (1440/1280), tablet-friendly (1024, 768). Below 1024px the sidebar is icon-only
(labels stay available to assistive tech); from 1024px it can be collapsed from the header. Tables
scroll horizontally inside their card, filter bars wrap, and the header search collapses to an icon
button. E2E test 9 asserts no page scrolls horizontally at 1440/1280/1024/768. Phone widths are out
of scope; that's the Tenant apps' job.
