import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SalesActivityLog } from "@/components/sales/SalesActivityLog";
import { SalesActivityLogEntry } from "@/services/api/sales";

interface SalesActivityLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entries: SalesActivityLogEntry[];
  onAdd: (note: string) => Promise<void>;
  isReadOnly?: boolean;
}

export function SalesActivityLogModal({
  open,
  onOpenChange,
  title,
  entries,
  onAdd,
  isReadOnly = false,
}: SalesActivityLogModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <SalesActivityLog entries={entries} onAdd={onAdd} isReadOnly={isReadOnly} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
