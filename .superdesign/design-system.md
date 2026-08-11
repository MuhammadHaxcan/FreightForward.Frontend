# WayBill Product Design System

## Product context

WayBill is a dense B2B freight-forwarding operations platform used by dispatch, documentation, accounts, customs, and management teams. Core jobs are locating shipments quickly, understanding route and milestone state, identifying exceptions, editing operational records, and opening documents/reports with minimal friction. The product should feel calm, exact, fast, and trustworthy under heavy daily use.

## Brand foundation

- Preserve the WayBill identity and existing logo assets in `src/assets/waybill-icon/`.
- Brand core: deep teal `#052E26`, emerald `#00C889`, mint `#6FE6B2`, soft canvas `#F6FAF8`, ink `#1B2B27`, border `#DDE9E4`.
- Use Inter only. Do not introduce serif, display, decorative, or alternate sans families.
- Color should communicate information, not decorate. Reserve saturated emerald for primary actions, active state, success, and selected data.
- Maintain professional freight/logistics character; avoid consumer-app gradients, glassmorphism, oversized cards, or excessive illustration.

## Layout and density

- Desktop-first operational views use the existing 224px sidebar, with a 64px collapsed state.
- Optimize tables for 1366–1600px desktop widths while preserving horizontal overflow at narrower widths.
- Use a 24px page gutter, 16–20px panel padding, 8–12px internal control gaps, and a tight 40px control height.
- Prefer one clear page toolbar over disconnected rows of filters and table controls.
- Dense grids should use a sticky header, 44–56px rows, strong column hierarchy, quiet dividers, and intentional whitespace.
- Keep primary identifiers (job number, customer, route) visually dominant; secondary dates/metadata use muted 11–12px text.

## Typography

- Page title: 22–24px / 600–700.
- Section or toolbar label: 13–14px / 600.
- Grid header: 11–12px / 650, subtle tracking, uppercase only where it improves scanning.
- Grid primary text: 13px / 500–600.
- Grid metadata: 11–12px / 400–500.
- Keep line-height compact but legible; never allow critical identifiers to look like footnotes.

## Components

- Cards/panels: white, 1px `#DDE9E4` border, 8–10px radius, subtle shadow only when needed for hierarchy.
- Inputs: white or near-white, 36–40px high, 6–8px radius, precise focus ring in emerald.
- Primary button: emerald surface, deep-teal text, medium weight. Secondary buttons use white with border.
- Status pills: compact, low-saturation backgrounds with darker semantic text; avoid solid gray/red/green blocks unless critical.
- Dialogs, alert dialogs, sheets, drawers, popovers, selects, and action menus use tokenized card/popover surfaces, the shared border token, and the shared radius scale. Modal overlays use the same 60% black scrim with a subtle 2px backdrop blur.
- Use the modal width scale (`max-w-modal-*`) instead of ad-hoc Tailwind maximum widths. Data-entry modal headers use the deep-teal modal-header token; lightweight confirmations may use the neutral card header.
- Never hard-code white, slate, or brand hex values on live application surfaces when a semantic token exists. Printable document canvases are the exception and remain explicitly white.
- Direction/mode should be a single compact visual unit when possible rather than stacked unrelated badges.
- Icon-only actions require tooltips, consistent 30–32px hit targets, and neutral surfaces; use color to emphasize destructive or primary actions only.
- Pagination belongs inside or immediately adjacent to the grid footer with results count and page-size control.

## Shipments grid priorities

- Make the route legible as a connected origin → destination unit, with ETD/ETA aligned to each port.
- Treat job number as the primary row anchor and place job date as supporting metadata.
- Keep HBL/MBL visually grouped but distinguish labels from values.
- Customer may be multiple parties; preserve scanability and indicate overflow without making the row excessively tall.
- Latest event needs description, location, and date, with truncation and title/tooltip support.
- Invoice-generated state should be self-explanatory; replace the current ambiguous legend with an explicit chip or row indicator.
- Actions should be compact and predictable, with edit/view and reports separated but adjacent.
- Filters should support quick search, job status, date range, and clear/reset state. Show active filters visibly.
- Loading, error, and empty states stay within the grid frame and explain the next action.

## Motion and interaction

- Use 150–200ms transitions for hover, selected, focus, and expanding filter controls.
- Sticky grid headers may add a subtle shadow only after scroll.
- Avoid animated layout shifts in dense data views.
- Preserve keyboard focus visibility and minimum practical pointer targets.

## Fidelity constraints

Use ONLY the fonts, colors, spacing, and component styles defined in this design system and the repository tokens. Do not introduce any fonts, colors, or visual styles not in the design system.
