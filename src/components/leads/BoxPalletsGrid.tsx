import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { LeadDetailItem, PackageType } from "@/services/api";
import { BoxPalletRowModal } from "./BoxPalletRowModal";

interface BoxPalletsGridProps {
  boxPallets: LeadDetailItem[];
  onChange: (boxPallets: LeadDetailItem[]) => void;
  packageTypes: PackageType[];
}

export function BoxPalletsGrid({ boxPallets, onChange, packageTypes }: BoxPalletsGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingIndex(null);
    setModalOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleDelete = (index: number) => {
    const updated = boxPallets.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSave = (boxPallet: LeadDetailItem) => {
    if (editingIndex !== null) {
      const updated = [...boxPallets];
      updated[editingIndex] = boxPallet;
      onChange(updated);
    } else {
      onChange([...boxPallets, boxPallet]);
    }
    setModalOpen(false);
    setEditingIndex(null);
  };

  const totalVolume = boxPallets.reduce((sum, bp) => sum + (bp.volume || 0), 0);
  const totalWeight = boxPallets.reduce((sum, bp) => sum + bp.weight * bp.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Box/Pallets (LTL)</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="text-green-600 border-green-600 hover:bg-green-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#2c3e50]">
              <TableHead className="text-white">Packaging</TableHead>
              <TableHead className="text-white">Qty</TableHead>
              <TableHead className="text-white">L</TableHead>
              <TableHead className="text-white">W</TableHead>
              <TableHead className="text-white">H</TableHead>
              <TableHead className="text-white">Measurement</TableHead>
              <TableHead className="text-white">Volume</TableHead>
              <TableHead className="text-white">Weight</TableHead>
              <TableHead className="text-white w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxPallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No items added. Click "Add Row" to add box/pallets.
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
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

      <BoxPalletRowModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        boxPallet={editingIndex !== null ? boxPallets[editingIndex] : null}
        onSave={handleSave}
        packageTypes={packageTypes}
      />
    </div>
  );
}
