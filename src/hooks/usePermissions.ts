import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { hasPermission, hasAnyPermission, user } = useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    permissions: user?.permissions ?? [],
    roles: user?.roles ?? [],

    // Convenience helpers for common checks
    canView: (module: string) => hasPermission(`${module}_view`),
    canAdd: (module: string) => hasPermission(`${module}_add`),
    canEdit: (module: string) => hasPermission(`${module}_edit`),
    canDelete: (module: string) => hasPermission(`${module}_delete`),

    // Module-specific shortcuts
    canViewShipments: hasPermission('ship_view'),
    canAddShipments: hasPermission('ship_add'),
    canEditShipments: hasPermission('ship_edit'),
    canDeleteShipments: hasPermission('ship_delete'),

    canViewCustomers: hasPermission('cust_view'),
    canAddCustomers: hasPermission('cust_add'),
    canEditCustomers: hasPermission('cust_edit'),
    canDeleteCustomers: hasPermission('cust_delete'),

    canViewLeads: hasPermission('leads_view'),
    canViewQuotations: hasPermission('quot_view'),
    canViewRateRequests: hasPermission('ratereq_view'),

    canViewInvoices: hasPermission('invoice_view'),
    canViewReceipts: hasPermission('receipt_view'),
    canViewExpenses: hasPermission('expense_view'),

    canViewUsers: hasPermission('user_view'),
    canViewRoles: hasPermission('role_view'),

    canViewSettings: hasAnyPermission(
      'banks_view', 'company_view', 'currency_view', 'port_view',
      'chargeitem_view', 'expensetype_view', 'custcat_view'
    ),
  };
}
