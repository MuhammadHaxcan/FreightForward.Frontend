import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import type { RateRequest } from "@/services/api";

const READONLY_INPUT = "bg-muted cursor-not-allowed";
const EM_DASH = "—";

const renderText = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? EM_DASH : String(value);

interface LockedRateRequestSectionProps {
  rateRequest: RateRequest;
}

/**
 * Displays the rate request's metadata as a single read-only Card:
 * Rate Code, Request Date, Status, Mode, Vendor Type, Vendor Name, Vendor Email.
 *
 * Used by QuotationForm to surface the source rate request's vendor + status
 * context. Pair with `<LockedLeadSections lead={...} />` for the upstream lead.
 */
export function LockedRateRequestSection({ rateRequest }: LockedRateRequestSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-primary flex items-center justify-between">
          <span>Rate Request</span>
          <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> from rate request
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Rate Code</Label>
            <Input value={renderText(rateRequest.rateRequestNo)} readOnly className={READONLY_INPUT} />
          </div>
          <div className="space-y-2">
            <Label>Request Date</Label>
            <Input
              value={renderText(rateRequest.requestDate ? rateRequest.requestDate.split("T")[0] : null)}
              readOnly
              className={READONLY_INPUT}
            />
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <Input value={renderText(rateRequest.modeDisplay || rateRequest.mode)} readOnly className={READONLY_INPUT} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={renderText(rateRequest.requestStatus)} readOnly className={READONLY_INPUT} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Vendor Type</Label>
            <Input value={renderText(rateRequest.vendorType)} readOnly className={READONLY_INPUT} />
          </div>
          <div className="space-y-2">
            <Label>Vendor Name</Label>
            <Input value={renderText(rateRequest.vendorName)} readOnly className={READONLY_INPUT} />
          </div>
          <div className="space-y-2">
            <Label>Vendor Email</Label>
            <Input value={renderText(rateRequest.vendorEmail)} readOnly className={READONLY_INPUT} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
