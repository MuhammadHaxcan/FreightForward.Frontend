import { Loader2 } from "lucide-react";

interface MutationBlockingOverlayProps {
  /** Set to true when a mutation is in-flight to block all interaction */
  isPending: boolean;
  /** Optional custom message shown alongside the spinner */
  message?: string;
  /**
   * 'dialog' (default) — absolute overlay inside a Dialog/AlertDialog container.
   * 'page' — fixed overlay covering the entire viewport; use for inline page forms.
   */
  variant?: "dialog" | "page";
}

/**
 * Renders a semi-transparent blocking layer when a mutation is in-flight.
 * Prevents all user interaction with the parent container or page:
 * - Double-clicking the submit button
 * - Editing form fields while a POST is in progress
 * - Closing the dialog via the X button or backdrop click
 *
 * variant="dialog" — place as a child inside DialogContent (absolute, overlays the dialog).
 * variant="page" — place inside a relative container on a page; renders a fixed overlay.
 */
export function MutationBlockingOverlay({ isPending, message, variant = "dialog" }: MutationBlockingOverlayProps) {
  if (!isPending) return null;

  if (variant === "page") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/75 backdrop-blur-sm gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm font-medium text-foreground animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/75 backdrop-blur-sm rounded-lg gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="text-sm font-medium text-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
