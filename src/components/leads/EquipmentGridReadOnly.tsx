import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadDetailItem } from "@/services/api";

interface EquipmentGridReadOnlyProps {
  equipments: LeadDetailItem[];
}

export function EquipmentGridReadOnly({ equipments }: EquipmentGridReadOnlyProps) {
  const totalWeight = equipments.reduce((sum, eq) => sum + eq.weight * eq.quantity, 0);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Equipment (FTL)</h4>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-modal-header">
              <TableHead className="text-white">Quantity</TableHead>
              <TableHead className="text-white">Equipment Type</TableHead>
              <TableHead className="text-white">Sub Category</TableHead>
              <TableHead className="text-white">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No equipment items.
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment, index) => (
                <TableRow key={index}>
                  <TableCell>{equipment.quantity}</TableCell>
                  <TableCell>{equipment.containerTypeName || "-"}</TableCell>
                  <TableCell>{equipment.subCategory || "-"}</TableCell>
                  <TableCell>{equipment.weight}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {equipments.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm font-medium">
            Weight Total: <span className="text-green-600">{totalWeight.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
