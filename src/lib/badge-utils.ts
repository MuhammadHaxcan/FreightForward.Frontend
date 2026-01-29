/**
 * Standardized status badge color utilities for consistent UI
 */

export type StatusType = 'success' | 'pending' | 'new' | 'cancelled' | 'closed' | 'warning' | 'error' | 'info';

/**
 * Standard status colors using Tailwind CSS classes
 */
export const statusColors: Record<StatusType, string> = {
  success: "bg-emerald-500 text-white",
  pending: "bg-yellow-500 text-white",
  new: "bg-blue-500 text-white",
  cancelled: "bg-red-500 text-white",
  closed: "bg-gray-500 text-white",
  warning: "bg-orange-500 text-white",
  error: "bg-red-600 text-white",
  info: "bg-sky-500 text-white",
};

/**
 * Light variant status colors (for badges with softer appearance)
 */
export const statusColorsLight: Record<StatusType, string> = {
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  warning: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
};

/**
 * Map common lead status strings to status types
 */
export const mapLeadStatus = (status: string): StatusType => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'new':
      return 'new';
    case 'enquiry':
    case 'pending':
    case 'in progress':
    case 'inprogress':
      return 'pending';
    case 'confirmed':
    case 'converted':
    case 'won':
      return 'success';
    case 'cancelled':
    case 'lost':
      return 'cancelled';
    case 'closed':
      return 'closed';
    default:
      return 'info';
  }
};

/**
 * Map common invoice/payment status strings to status types
 */
export const mapInvoiceStatus = (status: string): StatusType => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'paid':
    case 'completed':
      return 'success';
    case 'pending':
    case 'partial':
    case 'partially paid':
      return 'pending';
    case 'draft':
    case 'new':
      return 'new';
    case 'cancelled':
    case 'void':
    case 'voided':
      return 'cancelled';
    case 'overdue':
      return 'error';
    default:
      return 'info';
  }
};

/**
 * Map shipment direction to color classes
 */
export const shipmentDirectionColors: Record<string, string> = {
  'Import': "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  'Export': "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  'Cross Trade': "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20",
};

/**
 * Get badge classes for a status
 */
export const getStatusBadgeClasses = (status: string, variant: 'solid' | 'light' = 'solid'): string => {
  const baseClasses = "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap";
  const statusType = mapLeadStatus(status);
  const colorClasses = variant === 'light' ? statusColorsLight[statusType] : statusColors[statusType];
  return `${baseClasses} ${colorClasses}`;
};

/**
 * Get invoice status badge classes
 */
export const getInvoiceStatusBadgeClasses = (status: string, variant: 'solid' | 'light' = 'light'): string => {
  const baseClasses = "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap";
  const statusType = mapInvoiceStatus(status);
  const colorClasses = variant === 'light' ? statusColorsLight[statusType] : statusColors[statusType];
  return `${baseClasses} ${colorClasses}`;
};
