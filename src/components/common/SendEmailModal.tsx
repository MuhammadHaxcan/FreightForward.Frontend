import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export interface SendEmailRequest {
  recipientEmail: string;
  sendToCustomer: boolean;
  subject: string;
  body?: string;
}

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  recipientLabel: string; // "Customer" or "Vendor"
  subject: string;
  currentUserEmail: string;
  onSend: (request: SendEmailRequest) => Promise<void>;
  isSending: boolean;
  title?: string;
  onSkip?: () => void;
}

export function SendEmailModal({
  open,
  onOpenChange,
  recipientEmail,
  recipientLabel,
  subject: defaultSubject,
  currentUserEmail,
  onSend,
  isSending,
  title,
  onSkip,
}: SendEmailModalProps) {
  const [sendToCustomer, setSendToCustomer] = useState(false);
  const [editableRecipientEmail, setEditableRecipientEmail] = useState(recipientEmail);
  const [editableSubject, setEditableSubject] = useState(defaultSubject);

  // Reset form only on open transition (false → true). Depending on recipientEmail/defaultSubject
  // here would wipe in-progress user edits whenever a parent re-render produced a new
  // computed value for those props.
  useEffect(() => {
    if (open) {
      setSendToCustomer(false);
      setEditableRecipientEmail(recipientEmail);
      setEditableSubject(defaultSubject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSend = async () => {
    await onSend({
      recipientEmail: editableRecipientEmail,
      sendToCustomer,
      subject: editableSubject,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {title ?? `Send by Email`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Your email (read-only) */}
          <div className="space-y-2">
            <Label>Your Email</Label>
            <Input
              value={currentUserEmail}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email will always be sent to your inbox.
            </p>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={editableSubject}
              onChange={(e) => setEditableSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          {/* Send to Customer/Vendor checkbox */}
          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="sendToCustomer"
              checked={sendToCustomer}
              onCheckedChange={(checked) => setSendToCustomer(!!checked)}
            />
            <Label htmlFor="sendToCustomer" className="cursor-pointer font-normal">
              Also send to {recipientLabel}
            </Label>
          </div>

          {/* Recipient email — shown only when checkbox is checked */}
          {sendToCustomer && (
            <div className="space-y-2">
              <Label>{recipientLabel} Email</Label>
              <Input
                value={editableRecipientEmail}
                onChange={(e) => setEditableRecipientEmail(e.target.value)}
                placeholder={`${recipientLabel.toLowerCase()}@example.com`}
                type="email"
              />
            </div>
          )}

          {/* Routing explanation */}
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            {sendToCustomer ? (
              <>
                <p>• Email to <strong>{recipientLabel}</strong> (CC: you + admin)</p>
                <p>• Copy to <strong>you</strong> (CC: admin)</p>
              </>
            ) : (
              <p>• Email to <strong>you</strong> (CC: admin)</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          {onSkip && (
            <Button variant="secondary" onClick={onSkip} disabled={isSending}>
              Skip
            </Button>
          )}
          <Button
            onClick={handleSend}
            disabled={isSending || (sendToCustomer && !editableRecipientEmail)}
          >
            {isSending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              "Send Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
