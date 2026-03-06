import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { shipmentApi, type CreateShipmentHouseBLRequest, type ShipmentHouseBL, type ShipmentContainer, type BLServiceType, type FreightType } from '@/services/api/shipment';
import { useToast } from '@/hooks/use-toast';

interface HouseBLModalProps {
  open: boolean;
  onClose: () => void;
  shipmentId: number;
  houseBL?: ShipmentHouseBL | null;
  onSaved: () => void;
  containers?: ShipmentContainer[];
}

interface ContainerAllocationRow {
  shipmentContainerId: number;
  containerNumber: string;
  containerTypeName?: string;
  pieces: number;
  grossWeight: number;
  volume: number;
  enabled: boolean;
}

const blServiceTypes: { value: BLServiceType; label: string }[] = [
  { value: 'FCLFCL', label: 'FCL/FCL' },
  { value: 'LCLLCL', label: 'LCL/LCL' },
  { value: 'LCLFCL', label: 'LCL/FCL' },
  { value: 'FCLLCL', label: 'FCL/LCL' },
];

const freightTypes: { value: FreightType; label: string }[] = [
  { value: 'Prepaid', label: 'Prepaid' },
  { value: 'Collect', label: 'Collect' },
];

const hblStatuses = ['HBL', 'HAWB', 'EXPRESS'];

export function HouseBLModal({ open, onClose, shipmentId, houseBL, onSaved, containers }: HouseBLModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateShipmentHouseBLRequest>({
    houseBLNo: '',
    houseBLDate: undefined,
    houseBLStatus: '',
    hblServiceType: undefined,
    hblNoBLIssued: '',
    hblFreight: undefined,
    shipperName: '',
    consigneeName: '',
    notifyPartyName: '',
    marksNumbers: '',
    notes: '',
  });
  const [containerAllocations, setContainerAllocations] = useState<ContainerAllocationRow[]>([]);

  useEffect(() => {
    if (houseBL) {
      setForm({
        houseBLNo: houseBL.houseBLNo || '',
        houseBLDate: houseBL.houseBLDate || undefined,
        houseBLStatus: houseBL.houseBLStatus || '',
        hblServiceType: houseBL.hblServiceType as BLServiceType | undefined,
        hblNoBLIssued: houseBL.hblNoBLIssued || '',
        hblFreight: houseBL.hblFreight as FreightType | undefined,
        shipperName: houseBL.shipperName || '',
        consigneeName: houseBL.consigneeName || '',
        notifyPartyName: houseBL.notifyPartyName || '',
        marksNumbers: houseBL.marksNumbers || '',
        notes: houseBL.notes || '',
      });
    } else {
      setForm({
        houseBLNo: '',
        houseBLDate: undefined,
        houseBLStatus: '',
        hblServiceType: undefined,
        hblNoBLIssued: '',
        hblFreight: undefined,
        shipperName: '',
        consigneeName: '',
        notifyPartyName: '',
        marksNumbers: '',
        notes: '',
      });
    }

    // Build container allocation rows
    if (containers && containers.length > 0) {
      const existingAllocations = houseBL?.containerAllocations || [];
      const rows: ContainerAllocationRow[] = containers.map((c) => {
        const existing = existingAllocations.find((a) => a.shipmentContainerId === c.id);
        return {
          shipmentContainerId: c.id,
          containerNumber: c.containerNumber,
          containerTypeName: c.containerTypeName,
          pieces: existing?.pieces ?? 0,
          grossWeight: existing?.grossWeight ?? 0,
          volume: existing?.volume ?? 0,
          enabled: !!existing,
        };
      });
      setContainerAllocations(rows);
    } else {
      setContainerAllocations([]);
    }
  }, [houseBL, open, containers]);

  const updateAllocation = (index: number, field: keyof ContainerAllocationRow, value: unknown) => {
    setContainerAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const allocationsToSave = containerAllocations
        .filter((a) => a.enabled)
        .map(({ shipmentContainerId, pieces, grossWeight, volume }) => ({
          shipmentContainerId,
          pieces,
          grossWeight,
          volume,
        }));

      const requestData: CreateShipmentHouseBLRequest = {
        ...form,
        containerAllocations: allocationsToSave,
      };

      if (houseBL) {
        await shipmentApi.updateHouseBL(houseBL.id, requestData);
        toast({ title: 'House B/L updated' });
      } else {
        await shipmentApi.addHouseBL(shipmentId, requestData);
        toast({ title: 'House B/L added' });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{houseBL ? 'Edit House B/L' : 'Add House B/L'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>HBL Number</Label>
            <Input
              value={form.houseBLNo || ''}
              onChange={(e) => setForm({ ...form, houseBLNo: e.target.value })}
              placeholder="House B/L Number"
            />
          </div>
          <div>
            <Label>HBL Date</Label>
            <Input
              type="date"
              value={form.houseBLDate || ''}
              onChange={(e) => setForm({ ...form, houseBLDate: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label>HBL Status</Label>
            <Select value={form.houseBLStatus || ''} onValueChange={(v) => setForm({ ...form, houseBLStatus: v })}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {hblStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Service Type</Label>
            <Select value={form.hblServiceType || ''} onValueChange={(v) => setForm({ ...form, hblServiceType: v as BLServiceType })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {blServiceTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>No. of B/L Issued</Label>
            <Input
              value={form.hblNoBLIssued || ''}
              onChange={(e) => setForm({ ...form, hblNoBLIssued: e.target.value })}
            />
          </div>
          <div>
            <Label>Freight</Label>
            <Select value={form.hblFreight || ''} onValueChange={(v) => setForm({ ...form, hblFreight: v as FreightType })}>
              <SelectTrigger><SelectValue placeholder="Select freight" /></SelectTrigger>
              <SelectContent>
                {freightTypes.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Marks & Numbers</Label>
            <Textarea
              value={form.marksNumbers || ''}
              onChange={(e) => setForm({ ...form, marksNumbers: e.target.value })}
              rows={2}
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          {containerAllocations.length > 0 && (
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-sm font-medium text-muted-foreground mb-3">Container Allocations</p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-2 text-left w-10"></th>
                      <th className="p-2 text-left">Container No</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-right">Pieces</th>
                      <th className="p-2 text-right">Gross Wt (kg)</th>
                      <th className="p-2 text-right">Volume (CBM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {containerAllocations.map((row, idx) => {
                      const container = containers?.find((c) => c.id === row.shipmentContainerId);
                      return (
                        <tr key={row.shipmentContainerId} className="border-b last:border-b-0">
                          <td className="p-2">
                            <Checkbox
                              checked={row.enabled}
                              onCheckedChange={(checked) => updateAllocation(idx, 'enabled', !!checked)}
                            />
                          </td>
                          <td className="p-2 font-mono text-xs">{row.containerNumber}</td>
                          <td className="p-2 text-xs text-muted-foreground">{row.containerTypeName || '-'}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              className="h-8 w-20 text-right ml-auto"
                              value={row.pieces || ''}
                              placeholder={container?.noOfPcs?.toString() || '0'}
                              disabled={!row.enabled}
                              onChange={(e) => updateAllocation(idx, 'pieces', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.001"
                              className="h-8 w-24 text-right ml-auto"
                              value={row.grossWeight || ''}
                              placeholder={container?.grossWeight?.toString() || '0'}
                              disabled={!row.enabled}
                              onChange={(e) => updateAllocation(idx, 'grossWeight', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.001"
                              className="h-8 w-24 text-right ml-auto"
                              value={row.volume || ''}
                              placeholder={container?.volume?.toString() || '0'}
                              disabled={!row.enabled}
                              onChange={(e) => updateAllocation(idx, 'volume', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : houseBL ? 'Update' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
