# Accessibility

Target: WCAG 2.2 AA for a desktop-first operational app. Phase 3 audited keyboard navigation,
focus management, dialogs, forms, tables, the command palette, notifications, the sidebar,
icon buttons, screen-reader labels and status indicators.

## Fixed in Phase 3

| Area | Problem | Fix |
| --- | --- | --- |
| Tabs | Roving `tabIndex=-1` with **no arrow-key handling**: keyboard users couldn't reach any non-selected tab | ←/→/Home/End, `aria-controls` / `tabpanel` linkage (`components/ui/tabs.tsx`) |
| Dialog | No focus trap (Tab escaped behind the modal); any parent re-render stole focus back to the first field; hard-coded ids collided; background scrolled | Tab trap, `onClose` held in a ref, `useId`, scroll lock, focus lands in the body not on the close button |
| Tables | `role="button"` on `<tr>` hid row/cell semantics from screen readers | Real rows, focusable + Enter/Space; `caption`; labelled pagination `nav` |
| Room cards | Clickable `div`s (mouse only) | Real links |
| Notifications | Link-less items were clickable `div`s; popover had no Escape/`aria-expanded` | Link or explicit "Mark as read" button; Escape returns focus; unread state announced as text |
| User menu | `role="menu"` without Escape or focus movement | Focus moves into the menu; Escape closes and returns focus |
| Toasts | Errors auto-dismissed after 6 s (WCAG 2.2.1) and were announced politely | Error toasts are `role="alert"` and persist until dismissed |
| Navigation | Focus stayed on the clicked link after route change; tab title never changed | Focus moves to `<main>` on path change; per-module `document.title`; skip-to-content link |
| Sidebar | `NavLink` put `aria-current` on several items sharing a target | Explicit `aria-current="page"` from the match rule; `nav` labelled "Primary" |
| Header search | Decorative box that did nothing | Real button (`aria-keyshortcuts`) opening an ARIA combobox/listbox palette |

## Conventions

- **Never colour alone.** Statuses always render a text label (`StatusBadge`), alerts carry a
  severity icon plus a visually hidden severity word, and charts are `aria-hidden` next to a text
  legend holding the same numbers.
- **Icon-only buttons** need `aria-label`; decorative icons need `aria-hidden="true"`.
- **Every input has a label** (`Label htmlFor` or `aria-label` for compact filter controls). Error
  text uses `role="alert"` and is linked with `aria-describedby`.
- **Loading regions** use `aria-busy`. Errors use `role="alert"`, and error is always shown before
  "empty" (`QueryState`).
- **Tests find things by role and name**, so an inaccessible control usually shows up as a
  failing test.

## Known limitations

- Colour contrast of some brand tints (`text-muted-foreground` at 10–11 px) hasn't been measured
  with tooling. Run an axe/Lighthouse pass against a real deployment.
- Phone widths are out of scope (desktop-first, tablet-friendly).
