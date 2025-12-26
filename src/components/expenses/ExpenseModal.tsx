import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { format } from "date-fns";

interface Expense {
  id: string;
  date: string;
  paymentType: string;
  paymentMode: string;
  category: string;
  bank: string;
  description: string;
  receipt: string;
  currency: string;
  amount: number;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, "id">) => void;
  expense: Expense | null;
  categories: string[];
  banks: string[];
}

const paymentTypes = ["Inwards", "Outwards"];
const paymentModes = ["CASH", "CHEQUE", "BANK WIRE", "BANK TRANSFER", "CARD"];
const currencies = ["AED", "USD", "EUR", "GBP", "SAR"];

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  categories,
  banks,
}: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    paymentType: "",
    paymentMode: "",
    category: "",
    bank: "",
    description: "",
    receipt: "---",
    currency: "AED",
    amount: 0,
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        paymentType: expense.paymentType,
        paymentMode: expense.paymentMode,
        category: expense.category,
        bank: expense.bank,
        description: expense.description,
        receipt: expense.receipt,
        currency: expense.currency,
        amount: expense.amount,
      });
    } else {
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        paymentType: "",
        paymentMode: "",
        category: "",
        bank: "",
        description: "",
        receipt: "---",
        currency: "AED",
        amount: 0,
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Record" : "New Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Type</label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select One" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Currency</label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((cur) => (
                    <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount</label>
              <Input
                type="number"
                placeholder="Paid Amount"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bill Copy</label>
              <Input type="file" className="cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Mode</label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bank</label>
              <Select
                value={formData.bank}
                onValueChange={(value) => setFormData({ ...formData, bank: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expense Date</label>
              <DateInput
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Submit
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
