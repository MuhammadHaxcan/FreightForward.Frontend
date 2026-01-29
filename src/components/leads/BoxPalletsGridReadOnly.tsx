import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadDetailItem } from "@/services/api";

interface BoxPalletsGridReadOnlyProps {
  boxPallets: LeadDetailItem[];
}

export function BoxPalletsGridReadOnly({ boxPallets }: BoxPalletsGridReadOnlyProps) {
  const totalVolume = boxPallets.reduce((sum, bp) => sum + (bp.volume || 0), 0);
  const totalWeight = boxPallets.reduce((sum, bp) => sum + bp.weight * bp.quantity, 0);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Box/Pallets (LTL)</h4>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-modal-header">
              <TableHead className="text-white">Packaging</TableHead>
              <TableHead className="text-white">Qty</TableHead>
              <TableHead className="text-white">L</TableHead>
              <TableHead className="text-white">W</TableHead>
              <TableHead className="text-white">H</TableHead>
              <TableHead className="text-white">Measurement</TableHead>
              <TableHead className="text-white">Volume</TableHead>
              <TableHead className="text-white">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxPallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No box/pallet items.
                </TableCell>
              </TableRow>
            ) : (
              boxPallets.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.packageTypeName || "-"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.length || 0}</TableCell>
                  <TableCell>{item.width || 0}</TableCell>
                  <TableCell>{item.height || 0}</TableCell>
                  <TableCell>{item.measurementType || "-"}</TableCell>
                  <TableCell>{item.volume?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>{item.weight}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {boxPallets.length > 0 && (
        <div className="flex justify-end gap-6">
          <div className="text-sm font-medium">
            Volume Total: <span className="text-green-600">{totalVolume.toFixed(2)}</span>
          </div>
          <div className="text-sm font-medium">
            Weight Total: <span className="text-green-600">{totalWeight.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
