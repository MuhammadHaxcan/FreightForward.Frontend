# Extractable Components

## Layout Components

## Sidebar
- Source: `src/components/layout/Sidebar.tsx`
- Category: layout
- Description: Responsive WayBill navigation shell with brand, user/office context, permission-filtered menus, active state, collapse, and mobile drawer.
- Extractable props: `activePath` (string, default: "/shipments"), `collapsed` (boolean, default: false), `officeName` (string, default: "Dubai Office"), `userName` (string, default: "Operations User"), `userRole` (string, default: "Administrator")
- Hardcoded: WayBill logo assets, navigation labels, Lucide icon choices, deep-teal/mint styling.

## MainLayout
- Source: `src/components/layout/MainLayout.tsx`
- Category: layout
- Description: Full-height app shell combining Sidebar, scrollable content, and CBM calculator.
- Extractable props: none; page content belongs in the default slot.
- Hardcoded: sidebar placement, responsive top offset, CBM calculator presence.

## CBMCalculatorWidget
- Source: `src/components/CBMCalculatorWidget.tsx`
- Category: layout
- Description: Floating global utility to calculate shipment volume and volumetric weight.
- Extractable props: `open` (boolean, default: false)
- Hardcoded: calculator labels, formulas, icon, surface styling.

## Basic Components

## Button
- Source: `src/components/ui/button.tsx`
- Category: basic
- Description: Tokenized CVA button.
- Extractable props: `variant`, `size`, `disabled`
- Hardcoded: component states and Tailwind classes.

## Badge
- Source: `src/components/ui/badge.tsx`
- Category: basic
- Description: Tokenized pill badge used for status and direction.
- Extractable props: `variant`
- Hardcoded: variant styles.

## SearchableSelect
- Source: `src/components/ui/searchable-select.tsx`
- Category: basic
- Description: Compact searchable select used in grid filters.
- Extractable props: `value`, `placeholder`, `disabled`
- Hardcoded: popover and command behavior.

## DateRangePicker
- Source: `src/components/ui/date-range-picker.tsx`
- Category: basic
- Description: Preset/custom date range control.
- Extractable props: `value`, `placeholder`
- Hardcoded: preset labels and calendar behavior.

