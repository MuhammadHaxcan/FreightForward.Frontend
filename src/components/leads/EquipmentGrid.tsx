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
import { LeadDetailItem, ContainerType } from "@/services/api";
import { EquipmentRowModal } from "./EquipmentRowModal";

interface EquipmentGridProps {
  equipments: LeadDetailItem[];
  onChange: (equipments: LeadDetailItem[]) => void;
  containerTypes: ContainerType[];
}

export function EquipmentGrid({ equipments, onChange, containerTypes }: EquipmentGridProps) {
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
    const updated = equipments.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSave = (equipment: LeadDetailItem) => {
    if (editingIndex !== null) {
      const updated = [...equipments];
      updated[editingIndex] = equipment;
      onChange(updated);
    } else {
      onChange([...equipments, equipment]);
    }
    setModalOpen(false);
    setEditingIndex(null);
  };

  const totalWeight = equipments.reduce((sum, eq) => sum + eq.weight * eq.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Equipment (FTL)</h4>
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
              <TableHead className="text-white">Quantity</TableHead>
              <TableHead className="text-white">Equipment Type</TableHead>
              <TableHead className="text-white">Sub Category</TableHead>
              <TableHead className="text-white">Weight</TableHead>
              <TableHead className="text-white w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No equipment added. Click "Add Row" to add equipment.
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment, index) => (
                <TableRow key={index}>
                  <TableCell>{equipment.quantity}</TableCell>
                  <TableCell>{equipment.containerTypeName || "-"}</TableCell>
                  <TableCell>{equipment.subCategory || "-"}</TableCell>
                  <TableCell>{equipment.weight}</TableCell>
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

      {equipments.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm font-medium">
            Weight Total: <span className="text-green-600">{totalWeight.toFixed(2)}</span>
          </div>
        </div>
      )}

      <EquipmentRowModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        equipment={editingIndex !== null ? equipments[editingIndex] : null}
        onSave={handleSave}
        containerTypes={containerTypes}
      />
    </div>
  );
}
