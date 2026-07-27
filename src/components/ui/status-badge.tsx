import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent"
  | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
  info:
    "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  accent:
    "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  neutral:
    "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const statusTones: Record<string, StatusTone> = {
  opened: "success",
  open: "success",
  active: "success",
  available: "success",
  approved: "success",
  received: "success",
  paid: "success",
  completed: "success",
  complete: "success",
  present: "success",
  fullyrepaid: "success",
  matured: "success",
  reconciled: "success",
  posted: "success",
  delivered: "success",

  pending: "warning",
  draft: "warning",
  partiallypaid: "warning",
  partial: "warning",
  probation: "warning",
  late: "warning",
  halfday: "warning",
  raterequested: "warning",
  inprogress: "warning",
  processing: "warning",
  due: "warning",
  annualleave: "warning",
  sickleave: "warning",
  leave: "warning",

  cancelled: "danger",
  canceled: "danger",
  rejected: "danger",
  overdue: "danger",
  terminated: "danger",
  absent: "danger",
  failed: "danger",
  inactive: "danger",
  void: "danger",
  expired: "danger",
  unpaid: "danger",

  new: "info",
  sent: "info",
  accepted: "info",
  holiday: "info",

  quoted: "accent",
  converted: "accent",

  closed: "neutral",
  resigned: "neutral",
  writtenoff: "neutral",
};

const statusLabels: Record<string, string> = {
  raterequested: "Rate Requested",
  partiallypaid: "Partially Paid",
  fullyrepaid: "Fully Repaid",
  writtenoff: "Written Off",
  halfday: "Half Day",
  annualleave: "Annual Leave",
  sickleave: "Sick Leave",
};

const normalizeStatus = (status: string) =>
  status.trim().toLowerCase().replace(/[\s_-]+/g, "");

const formatStatusLabel = (status: string) => {
  const normalized = normalizeStatus(status);
  if (statusLabels[normalized]) return statusLabels[normalized];

  return status
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusTone = (status: string): StatusTone =>
  statusTones[normalizeStatus(status)] || "neutral";

export interface StatusBadgeProps
  extends Omit<BadgeProps, "children" | "variant"> {
  status: string;
  label?: React.ReactNode;
  tone?: StatusTone;
}

export function StatusBadge({
  status,
  label,
  tone,
  className,
  ...props
}: StatusBadgeProps) {
  const resolvedTone = tone || getStatusTone(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap text-[0.825rem] font-semibold",
        toneClasses[resolvedTone],
        className,
      )}
      {...props}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
