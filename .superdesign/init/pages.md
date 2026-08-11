# Key Page Dependency Trees

These are the UI-relevant local dependency trees. API and mutation implementation branches remain source-side but are not useful design context.

## /shipments — Shipments grid
Entry: `src/pages/Shipments.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
  - `src/components/layout/Sidebar.tsx`
    - `src/components/ui/badge.tsx`
    - `src/components/ui/avatar.tsx`
    - `src/config/branding.ts`
    - `src/lib/utils.ts`
    - `src/contexts/AuthContext.tsx`
  - `src/components/CBMCalculatorWidget.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/searchable-select.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/command.tsx`
- `src/components/ui/date-range-picker.tsx`
  - `src/components/ui/calendar.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/badge.tsx`
- `src/components/auth/PermissionGate.tsx`
- `src/lib/utils.ts`
- `src/lib/status-event-utils.ts`
- `src/hooks/useShipments.ts`
- `src/services/api/index.ts`

## / — Dashboard
Entry: `src/pages/Dashboard.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/chart.tsx`
- `src/components/ui/skeleton.tsx`
- `src/hooks/useDashboard.ts`

## /exceptions — Exception dashboard
Entry: `src/pages/ExceptionDashboard.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/table.tsx`

## /shipments/add — Shipment form
Entry: `src/pages/AddShipment.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/shipments/CargoContainerTab.tsx`
- `src/components/shipments/CustomsTab.tsx`
- `src/components/shipments/ContainerModal.tsx`
- `src/components/shipments/CostingModal.tsx`
- `src/components/shipments/DocumentModal.tsx`
- `src/components/shipments/InvoiceModal.tsx`
- `src/components/shipments/PurchaseModal.tsx`
- `src/components/shipments/StatusLogModal.tsx`
- `src/components/shipments/StatusTimeline.tsx`
- `src/components/shipments/ShipmentJourneyCalendar.tsx`
- `src/components/ui/*` form, tabs, select, dialog, table, badge, and button primitives

## /master-customers — Customer grid
Entry: `src/pages/MasterCustomers.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/searchable-select.tsx`

## /sales/leads — Leads grid
Entry: `src/pages/Leads.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/sales/SalesActivityLogModal.tsx`

## /sales/rate-requests — Rate-request grid
Entry: `src/pages/RateRequests.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`

## /sales/quotations — Quotations grid
Entry: `src/pages/Quotations.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`

## /accounts/invoices — Invoice grid
Entry: `src/pages/Invoices.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/date-range-picker.tsx`

## /settings — Settings
Entry: `src/pages/Settings.tsx`
Dependencies:
- `src/components/layout/MainLayout.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/settings/SmtpSettingsTab.tsx`
- `src/components/settings/CurrencyRateHistoryModal.tsx`

