import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { shipmentApi, type ProrationPreview, type ProrationAllocation, type ProrationMethod } from '@/services/api/shipment';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyTypes } from '@/hooks/useSettings';

interface ProrationModalProps {
  open: boolean;
  onClose: () => void;
  shipmentId: number;
  costingId: number;
  costingDescription: string;
  costingAmount: number;
  onSaved: () => void;
}

const methods: { value: ProrationMethod; label: string }[] = [
  { value: 'ByWeight', label: 'By Weight' },
  { value: 'ByCBM', label: 'By CBM' },
  { value: 'EqualSplit', label: 'Equal Split' },
  { value: 'Manual', label: 'Manual' },
];

export function ProrationModal({
  open,
  onClose,
  shipmentId,
  costingId,
  costingDescription,
  costingAmount,
  onSaved,
}: ProrationModalProps) {
  const { toast } = useToast();
  const [method, setMethod] = useState<ProrationMethod>('ByWeight');
  const [preview, setPreview] = useState<ProrationPreview | null>(null);
  const [manualAllocations, setManualAllocations] = useState<Record<number, number>>({});
  const [billToAllocations, setBillToAllocations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saleCurrencyId, setSaleCurrencyId] = useState<number | undefined>();
  const [saleExRate, setSaleExRate] = useState<number>(1);
  const [saleTaxPct, setSaleTaxPct] = useState<number>(0);
  const { data: currencyData } = useCurrencyTypes({ pageSize: 100 });

  useEffect(() => {
    if (open && costingId) {
      loadPreview(method);
    }
  }, [open, costingId]);

  const loadPreview = async (m: ProrationMethod) => {
    setLoading(true);
    try {
      const response = await shipmentApi.getProrationPreview(shipmentId, costingId, m);
      const data = response.data ?? response;
      setPreview(data as ProrationPreview);
      setSaleCurrencyId(data.costCurrencyId ?? undefined);
      setSaleExRate(data.costExRate || 1);
      if (m === 'Manual') {
        const allocs: Record<number, number> = {};
        data.allocations.forEach((a) => {
          allocs[a.houseBLId] = a.allocatedAmount;
        });
        setManualAllocations(allocs);
      }
      // Auto-select first debtor for each HBL
      const billTo: Record<number, number> = {};
      data.allocations.forEach((a) => {
        const firstDebtor = a.debtors?.[0];
        if (firstDebtor?.customerId) {
          billTo[a.houseBLId] = firstDebtor.customerId;
        }
      });
      setBillToAllocations(billTo);
    } catch (err) {
      toast({ title: 'Error loading preview', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (m: ProrationMethod) => {
    setMethod(m);
    loadPreview(m);
  };

  const handleManualChange = (houseBLId: number, value: string) => {
    const amount = parseFloat(value) || 0;
    setManualAllocations((prev) => ({ ...prev, [houseBLId]: amount }));
  };

  const handleBillToChange = (houseBLId: number, customerIdStr: string) => {
    const customerId = parseInt(customerIdStr);
    if (!isNaN(customerId)) {
      setBillToAllocations((prev) => ({ ...prev, [houseBLId]: customerId }));
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await shipmentApi.prorate(shipmentId, costingId, {
        method,
        manualAllocations: method === 'Manual' ? manualAllocations : undefined,
        billToAllocations,
        saleCurrencyId,
        saleExRate,
        saleTaxPercentage: saleTaxPct,
      });
      toast({ title: 'Proration applied successfully' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const handleRemoveProration = async () => {
    setConfirming(true);
    try {
      await shipmentApi.removeProration(shipmentId, costingId);
      toast({ title: 'Proration removed' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const allocations: ProrationAllocation[] =
    method === 'Manual' && preview
      ? preview.allocations.map((a) => ({
          ...a,
          allocatedAmount: manualAllocations[a.houseBLId] ?? a.allocatedAmount,
          allocationPercent:
            costingAmount > 0
              ? Math.round(((manualAllocations[a.houseBLId] ?? a.allocatedAmount) / costingAmount) * 10000) / 100
              : 0,
        }))
      : preview?.allocations ?? [];

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prorate Cost</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm font-medium">{costingDescription}</p>
            <p className="text-sm text-muted-foreground">
              Total Amount: <span className="font-semibold">{costingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border rounded-md p-3">
            <div>
              <Label className="text-xs text-muted-foreground">Charge Type</Label>
              <p className="text-sm font-medium">{preview?.description || costingDescription}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">PPCC</Label>
              <p className="text-sm font-medium">{preview?.ppcc || '-'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <p className="text-sm font-medium">BL</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <Select
                value={saleCurrencyId?.toString() || ''}
                onValueChange={(v) => setSaleCurrencyId(parseInt(v))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyData?.items?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ex. Rate</Label>
              <Input
                type="number"
                step="0.0001"
                className="h-8"
                value={saleExRate}
                onChange={(e) => setSaleExRate(parseFloat(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tax %</Label>
              <Input
                type="number"
                step="0.01"
                className="h-8"
                value={saleTaxPct}
                onChange={(e) => setSaleTaxPct(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => handleMethodChange(v as ProrationMethod)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HBL No</TableHead>
                  <TableHead>Bill To (Customer)</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">CBM</TableHead>
                  <TableHead className="text-right">Allocation %</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.houseBLId}>
                    <TableCell className="font-medium">{a.houseBLNo || '-'}</TableCell>
                    <TableCell>
                      {a.debtors && a.debtors.length > 0 ? (
                        <Select
                          value={billToAllocations[a.houseBLId]?.toString() || ''}
                          onValueChange={(v) => handleBillToChange(a.houseBLId, v)}
                        >
                          <SelectTrigger className="h-8 w-48">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {a.debtors.map((d) => (
                              <SelectItem key={d.customerId} value={d.customerId?.toString() || ''}>
                                {d.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">No debtors</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{a.weight.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{a.cbm.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{a.allocationPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      {method === 'Manual' ? (
                        <Input
                          type="number"
                          step="0.01"
                          className="w-28 text-right h-8"
                          value={manualAllocations[a.houseBLId] ?? ''}
                          onChange={(e) => handleManualChange(a.houseBLId, e.target.value)}
                        />
                      ) : (
                        a.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={5} className="text-right">Total</TableCell>
                  <TableCell className="text-right">
                    <span className={totalAllocated !== costingAmount && method === 'Manual' ? 'text-destructive' : ''}>
                      {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {method === 'Manual' && totalAllocated !== costingAmount && (
            <p className="text-sm text-destructive">
              Total allocation ({totalAllocated.toFixed(2)}) does not match cost amount ({costingAmount.toFixed(2)}).
              Difference: {(costingAmount - totalAllocated).toFixed(2)}
            </p>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="destructive" size="sm" onClick={handleRemoveProration} disabled={confirming}>
            Remove Proration
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={confirming || loading}>
              {confirming ? 'Applying...' : 'Confirm Proration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
